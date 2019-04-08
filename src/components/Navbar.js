import React from 'react'
import PropTypes from 'prop-types'
import { Link, matchPath, withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import map from 'lodash/map'

import { withStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Grid from '@material-ui/core/Grid'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Toolbar from '@material-ui/core/Toolbar'

import * as actions from '../redux/actions'
import chordboardLogo from '../chordboard-logo-dark.png'
import { Close as CloseIcon } from 'mdi-material-ui'

const styles = theme => ({
	root: {},
	flex: {
		flex: 1,
	},
	menuButton: {
		marginLeft: -12,
		marginRight: 20,
	},
	logo: {
		paddingRight: 8,
		height: 16,
	},
	tab: {},
})

class Navbar extends React.Component {
	static propTypes = {
		classes: PropTypes.object,
		history: PropTypes.object,
		location: PropTypes.object,
		// Redux props
		currentSet: PropTypes.object,
		setCurrentSetId: PropTypes.func.isRequired,
		setCurrentUser: PropTypes.func.isRequired,
		songs: PropTypes.array,
	}

	handleBackButton = () => {
		this.props.setCurrentSetId(null)
	}

	logout = () => {
		localStorage.setItem('user', '')

		this.props.setCurrentUser({ name: null })

		if (this.props.history) {
			this.props.history.push({ pathname: '/login' })
		}

		let loginFrom = localStorage.getItem('loginFrom')

		if (loginFrom === 'google') {
			//google logout as per https://developers.google.com/identity/sign-in/web/sign-in
			var auth2 = window.gapi.auth2.getAuthInstance()
			auth2.signOut().then(() => {
				console.log('Google user signed out')
			})
		} else if (loginFrom === 'facebook') {
			//facebook logout as per https://developers.facebook.com/docs/facebook-login/web/
			/*FB.logout( function ( response ) {
				// Person is now logged out
				console.log( 'Facebook user signed out' );
			} );*/
		}
	}

	setUserTextSize = () => this.props.setCurrentUser({ textSize: 82 })

	render() {
		const { classes, currentSet, location, songs } = this.props

		let songId
		const match = matchPath(location.pathname, {
			path: '/sets/:setId/songs/:songId',
			exact: true,
		})
		if (match) {
			songId = match.params.songId
		}

		return (
			<div className={classes.root}>
				<AppBar
					color="secondary"
					position="static"
					className="no-print"
				>
					<Toolbar>
						{currentSet ? (
							<Grid
								container
								padding="none"
								wrap="nowrap"
								zeroMinWidth
							>
								<Grid item>
									<IconButton
										color="inherit"
										onClick={this.handleBackButton}
									>
										<CloseIcon />
									</IconButton>
								</Grid>
								<Grid item xs zeroMinWidth>
									<Tabs
										indicatorColor="primary"
										value={songId || false}
										variant="scrollable"
										scrollButtons="auto"
									>
										<Tab
											key={'tabs-setlist'}
											component={Link}
											to={`/sets/${currentSet.id}`}
											label={'Set'}
											className={classes.tab}
											color="inherit"
											value={0}
										/>

										{map(songs, song => (
											<Tab
												key={`tabs-${song.id}`}
												component={Link}
												to={`/sets/${
													currentSet.id
												}/songs/${song.id}`}
												label={song.title}
												className={classes.tab}
												color="inherit"
												value={song.id}
											/>
										))}
									</Tabs>
								</Grid>
							</Grid>
						) : (
							<React.Fragment>
								<Link to="/">
									<img
										src={chordboardLogo}
										className={classes.logo}
										alt=""
									/>
								</Link>
								<Button
									component={Link}
									color="inherit"
									to="/sets"
								>
									Sets
								</Button>
								<Button
									component={Link}
									color="inherit"
									to="/songs"
								>
									Songs
								</Button>
							</React.Fragment>
						)}
					</Toolbar>
				</AppBar>
			</div>
		)
	}
}

const mapStateToProps = state => ({
	currentSet: state.currentSet.id
		? state.sets.byId[state.currentSet.id]
		: null,
	currentSong: state.songs.byId[state.currentSong.id],
	songs: state.currentSet.id
		? map(
			state.sets.byId[state.currentSet.id].songs,
			song => state.songs.byId[song.id]
		  )
		: null,
})

export default withRouter(
	connect(
		mapStateToProps,
		actions
	)(withStyles(styles)(Navbar))
)
