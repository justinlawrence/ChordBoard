import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { uniqBy } from 'lodash'
import { connect } from 'react-redux'
import { isAfter } from 'date-fns'

import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import Fade from '@material-ui/core/Fade'
import Grid from '@material-ui/core/Grid'
import IconButton from '@material-ui/core/IconButton'
import Avatar from '@material-ui/core/Avatar'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Paper from '@material-ui/core/Paper'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'

import { Sets, db, sync } from '../database'
import * as actions from '../redux/actions'
import ChordLine from './ChordLine'
import ChordPair from './ChordPair'
import ContentLimiter from './ContentLimiter'
import getKeyDiff from '../utils/getKeyDiff'
import Hero from './Hero'
import KeySelector from './KeySelector'
import Line from './Line'
import Parser from '../parsers/song-parser'
import Song from './Song'
import transposeChord from '../utils/transpose-chord'
import transposeLines from '../utils/transpose-lines'

import { linesToNashville } from '../utils/convertToNashville'
//import './SongViewer.scss';

import {
	Image as ImageIcon,
	Minus as MinusIcon,
	PlaylistPlus as PlaylistPlusIcon,
	Plus as PlusIcon,
	Pencil as PencilIcon,
	Settings as SettingsIcon
} from 'mdi-material-ui'

const styles = theme => ({
	capoButton: {
		borderRadius: 3,
		flexDirection: 'column',
		padding: theme.spacing.unit
	},
	root: {
		flexGrow: 1
	},
	paper: {
		padding: theme.spacing.unit * 2,
		height: '100%',
		color: theme.palette.text.secondary
	},
	control: {
		padding: theme.spacing.unit * 2
	},
	select: {
		width: theme.spacing.unit * 7
	}
})

class SongViewer extends Component {
	static propTypes = {
		setKey: PropTypes.string
	}

	state = {
		capoAmount: 0,
		chordSize: 16,
		isNashville: false,
		isSongKeyDialogOpen: false,
		setListMenuAnchorEl: null,
		displayKey: '',
		lines: [],
		setList: [],
		wordSize: 20
	}

	componentDidMount() {
		// Update an initial list when the component mounts.
		this.updateListOfSets()

		// Listen for any changes on the database.
		sync.on('change', this.updateListOfSets.bind(this))

		this.handleProps(this.props)

		const songId = this.props.song._id
		const setId = this.props.currentSet._id

		console.log('songId', songId)
		console.log('setId', setId)
	}

	componentWillReceiveProps(nextProps) {
		this.handleProps(nextProps)
	}

	componentWillUnmount() {
		sync.cancel()
	}

	addToSet = set => {
		const { song } = this.props

		db.get(set._id)
			.then(doc => {
				const data = {
					...doc
				}

				data.songs = data.songs || []
				data.songs.push({ _id: song._id, key: song.key })
				data.songs = uniqBy(data.songs, '_id')

				db.put(data)
					.then(() => {
						if (this.props.history) {
							const location = {
								pathname: `/sets/${doc._id}`
							}

							this.props.history.push(location)
						}
					})
					.catch(err => {
						if (err.name === 'conflict') {
							console.error('SongList.addToSet: conflict -', err)
						} else {
							console.error('SongList.addToSet -', err)
						}
					})
			})
			.catch(err => {
				console.error(err)
			})
	}

	createAddToSetHandler = set => () => {
		this.showSetListDropdown(false)()
		this.addToSet(set)
	}

	handleSelectSetKey = (option, amount) => {
		const { song } = this.props
		this.props.setCurrentSetSongKey({
			key: option.key,
			song
		})
	}

	handleSelectDisplayKey = option => {
		const key = option.key === this.props.setKey ? null : option.key

		this.setState({
			displayKey: key,
			isNashville: option.value === 'nashville'
		})

		this.props.setCurrentSongUserKey(key)
	}

	handleSongKeyDialogClose = () => this.setState({ isSongKeyDialogOpen: false })
	handleSongKeyDialogOpen = () => this.setState({ isSongKeyDialogOpen: true })

	handleProps = props => {
		//Set the page title to the song title
		document.title = props.song.title

		const songUser =
			(props.song.users &&
				props.song.users.find(u => u.id === props.user.id)) ||
			{}

		/*console.log( 'song key', props.song.key );
				console.log( 'set key', props.setKey );
				console.log( 'user key', songUser.key );*/

		const displayKey = songUser.key || props.setKey || props.song.key

		const parser = new Parser()
		const lines = parser.parse(props.song.content)

		this.setState({ displayKey, lines })
	}

	scrollToSection(section) {
		let totalVertPadding = 32
		let headerHeight = 92

		window.location.href = '#'
		window.location.href = '#section-' + section.index

		let scrollBottom =
			window.innerHeight - document.body.scrollTop + totalVertPadding

		if (headerHeight < scrollBottom) {
			// Go back 92 pixels to offset the header.
			window.scrollBy(0, -headerHeight)
		}
	}

	changeKey = key => {
		if (key) {
			this.setState({ displayKey: key })
			this.props.setCurrentSongUserKey(key)
		}
	}

	chordSizeDown = () =>
		this.setState(prevState => ({ chordSize: prevState.chordSize - 1 }))
	chordSizeUp = () =>
		this.setState(prevState => ({ chordSize: prevState.chordSize + 1 }))

	showSetListDropdown = isVisible => event =>
		this.setState({
			setListMenuAnchorEl: isVisible ? event.currentTarget : null
		})

	transposeDown = () => {
		this.changeKey(transposeChord(this.state.displayKey, -1))
	}
	transposeUp = () => {
		this.changeKey(transposeChord(this.state.displayKey, 1))
	}

	wordSizeDown = () =>
		this.setState(prevState => ({ wordSize: prevState.wordSize - 1 }))
	wordSizeUp = () =>
		this.setState(prevState => ({ wordSize: prevState.wordSize + 1 }))

	toggleNashville = value => () =>
		this.setState(prevState => ({
			isNashville: value !== undefined ? value : !prevState.isNashville
		}))

	updateListOfSets = () =>
		Sets.getAll().then(setList => this.setState({ setList }))

	render() {
		const { classes, setKey, song, onClose } = this.props
		const {
			chordSize,
			isNashville,
			isSongKeyDialogOpen,
			setListMenuAnchorEl,
			displayKey,
			lines: linesState,
			setList,
			wordSize
		} = this.state

		const capo = getKeyDiff(displayKey, setKey || song.key) //this is only for display purposes, telling the user where to put the capo
		const transposeAmount = getKeyDiff(song.key, displayKey) //this is how much to transpose by

		let lines = transposeLines(linesState, transposeAmount)
		if (isNashville) {
			lines = linesToNashville(displayKey, lines)
		}

		let sections = []

		let capoKeyDescr = ''

		if (capo) {
			capoKeyDescr = 'Capo ' + capo
		} else {
			capoKeyDescr = 'Capo key'
		}

		var setListActive = setList.filter(function(set) {
			return isAfter(set.setDate, new Date())
		})

		return (
			<Fade in={Boolean(song)} appear mountOnEnter unmountOnExit>
				<div className="song-viewer">
					<Hero>
						<ContentLimiter>
							<Grid container className={classes.root} justify="space-between">
								<Grid item xs={12} sm={8}>
									<Typography variant="h4" color="inherit">
										{song.title}
									</Typography>
									<Typography variant="subheading">{song.author}</Typography>
								</Grid>

								<Grid item xs={12} sm={4} className="no-print">
									<form autoComplete="off">
										{setKey && (
											<Tooltip title="The key everyone will be playing in">
												<KeySelector
													label="Set key"
													onSelect={this.handleSelectSetKey}
													songKey={setKey}
												/>
											</Tooltip>
										)}

										<Tooltip title="The key you will be playing in">
											<KeySelector
												label={capoKeyDescr}
												onSelect={this.handleSelectDisplayKey}
												songKey={displayKey || setKey}
												className={classes.select}
											/>
										</Tooltip>

										<Tooltip title="Edit song">
											<IconButton
												className={classes.button}
												href={`/songs/${song._id}/edit`}
											>
												<PencilIcon />
											</IconButton>
										</Tooltip>

										<Tooltip title="Add to set">
											<IconButton
												className={classes.button}
												onClick={this.showSetListDropdown(true)}
											>
												<PlaylistPlusIcon />
											</IconButton>
										</Tooltip>

										<Dialog
											anchorEl={setListMenuAnchorEl}
											onClose={this.showSetListDropdown(false)}
											open={Boolean(setListMenuAnchorEl)}
										>
											<DialogTitle id="add-to-set-title">
												Add to Set
											</DialogTitle>
											<List component="nav">
												{setListActive.map(set => (
													<ListItem
														button
														key={set._id}
														onClick={this.createAddToSetHandler(set)}
														value={set._id}
													>
														<Avatar>
															<ImageIcon />
														</Avatar>

														<ListItemText
															primary={set.author + ' • ' + set.title}
															secondary={set.setDate}
														/>
													</ListItem>
												))}
											</List>
										</Dialog>

										<Tooltip title="Song settings">
											<IconButton
												className={classes.button}
												onClick={this.handleSongKeyDialogOpen}
											>
												<SettingsIcon />
											</IconButton>
										</Tooltip>
									</form>
								</Grid>
							</Grid>
						</ContentLimiter>
					</Hero>

					<ContentLimiter>
						<section className="section">
							<div className="container">
								<Song chordSize={chordSize} lines={lines} wordSize={wordSize} />
								{/*<div className="song-viewer__song">
									{parseSong( lines, sections, chordSize )}
								</div>*/}
							</div>
						</section>
					</ContentLimiter>

					<Dialog
						aria-labelledby="songkey-dialog-title"
						onClose={this.handleSongKeyDialogClose}
						open={isSongKeyDialogOpen}
					>
						<DialogTitle id="songkey-dialog-title">Song Settings</DialogTitle>

						<Paper className={classes.control}>
							<Grid container className={classes.root}>
								<Grid item xs={12}>
									<Grid container spacing={16}>
										<Grid item xs={6}>
											<Typography variant="subheading">Capo Key</Typography>
										</Grid>

										<Grid item xs={6}>
											<IconButton
												aria-label="Transpose down"
												onClick={this.transposeDown}
											>
												<MinusIcon />
											</IconButton>

											<IconButton
												aria-label="Transpose up"
												onClick={this.transposeUp}
											>
												<PlusIcon />
											</IconButton>
											<KeySelector
												onSelect={this.handleSelectDisplayKey}
												songKey={displayKey}
											/>
										</Grid>
									</Grid>
								</Grid>

								<Grid item xs={12}>
									<Grid container spacing={16}>
										<Grid item xs={6}>
											<Typography variant="subheading">Word Size</Typography>
										</Grid>

										<Grid item xs={6}>
											<IconButton
												aria-label="Word size down"
												onClick={this.wordSizeDown}
											>
												<MinusIcon />
											</IconButton>

											<IconButton
												aria-label="Word size up"
												onClick={this.wordSizeUp}
											>
												<PlusIcon />
											</IconButton>
										</Grid>
									</Grid>
								</Grid>

								<Grid item xs={12}>
									<Grid container spacing={16}>
										<Grid item xs={6}>
											<Typography variant="subheading">Chord Size</Typography>
										</Grid>

										<Grid item xs={6}>
											<IconButton
												aria-label="Chord size down"
												onClick={this.chordSizeDown}
											>
												<MinusIcon />
											</IconButton>

											<IconButton
												aria-label="Chord size up"
												onClick={this.chordSizeUp}
											>
												<PlusIcon />
											</IconButton>
										</Grid>
									</Grid>
								</Grid>

								<Grid item xs={12}>
									<Grid container spacing={16}>
										<Grid item xs={6}>
											<Typography variant="subheading">
												Nashville Numbering
											</Typography>
										</Grid>

										<Grid item xs={6}>
											<Button
												variant="contained"
												aria-label="Toggle Nashville Numbering"
												onClick={this.toggleNashville()}
											>
												Toggle
											</Button>
										</Grid>
									</Grid>
								</Grid>
							</Grid>
						</Paper>
					</Dialog>
				</div>
			</Fade>
		)
	}
}

export default connect(
	null,
	actions
)(withStyles(styles)(SongViewer))

export function parseSong(lines, sections, chordSize) {
	let children = []
	let result = []
	let section = ''
	let sectionIndex = 0

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i]

		switch (lines[i].type) {
		case 'chord-line':
			children.push(<ChordLine key={i} chords={line.chords} />)
			break

		case 'chord-pair':
			children.push(
				<ChordPair key={i} chords={line.chords} text={line.text} />
			)
			break

		case 'empty':
			children.push(<div key={i} className="empty-line" />)
			break

		case 'line':
			children.push(<Line key={i} text={line.text} />)
			break

		case 'section':
			if (section) {
				// Finish off last section
				result.push(
					<section
						id={`section-${sectionIndex}`}
						key={`section-${sectionIndex}`}
						className="song-viewer__section"
						data-section={section}
					>
						{children}
					</section>
				)
				children = []
			} else {
				result = result.concat(children)
			}

			section = line.text
			sections.push({ title: line.text, index: sectionIndex })

			sectionIndex++

			break
		}
	} //end of loop through lines

	if (section) {
		result.push(
			<section
				id={`section-${sectionIndex}`}
				key={`section-${sectionIndex}`}
				className="song-viewer__section"
				data-section={section}
			>
				{children}
			</section>
		)
	}

	if (children.length && !section) {
		result = result.concat(children)
	}

	return result
}
