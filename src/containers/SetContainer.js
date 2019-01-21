import React, { Component } from 'react'
import { find, findIndex, remove } from 'lodash'
import { connect } from 'react-redux'
import { Route } from 'react-router-dom'

import * as actions from '../redux/actions'
import SongContainer from './SongContainer'
import SetViewer from '../components/SetViewer'
import transposeChord from '../utils/transpose-chord'

class SetContainer extends Component {
	state = {
		songs: []
	}

	componentDidMount() {
		this.handleProps(this.props)
	}

	componentDidUpdate() {
		this.handleProps(this.props)
	}

	handleChangeKey = (songId, amount) => {
		const set = { ...this.props.currentSet }

		const setSongs = set.songs.slice()
		const setSong = find(setSongs, s => s.id === songId)

		if (setSong) {
			setSong.key = transposeChord(setSong.key, amount)

			set.songs = setSongs

			if (set) {
				this.props.setCurrentSet(set)
				this.props.updateSet(set)
			}
		}
	}

	handleSongMove = (songId, targetIndex = 0) => {
		const set = { ...this.props.currentSet }
		const setSongs = set.songs.slice()
		const index = findIndex(setSongs, { id: songId })
		const song = setSongs[index]
		const newIndex = Math.max(Math.min(targetIndex, setSongs.length), 0)

		setSongs.splice(index, 1)
		setSongs.splice(newIndex, 0, song)

		set.songs = setSongs

		if (set) {
			this.props.setCurrentSet(set)
			this.props.updateSet(set)
		}
	}

	handleProps = props => {
		if (!this.props.currentSet || this.props.currentSet.id !== props.setId) {
			props.fetchCurrentSet(props.setId)
		}
	}

	handleRemoveSet = () => {
		if (window.confirm('Are you very sure you want to delete this set?')) {
			const set = this.props.currentSet

			this.props.removeSet(set.id)
			if (this.props.history) {
				const location = {
					pathname: '/sets'
				}

				this.props.history.replace(location)
			}
		}
	}

	handleRemoveSong = songId => {
		const set = { ...this.props.currentSet }
		const setSongs = set.songs.slice()
		const songs = this.state.songs.slice()

		remove(setSongs, { id: songId })
		remove(songs, { id: songId })

		set.songs = setSongs

		this.setState({ songs })

		if (set) {
			this.props.setCurrentSet(set)
			this.props.updateSet(set)
		}
	}

	render() {
		const { currentSet } = this.props

		return (
			currentSet && (
				<div>
					<Route
						exact
						path="/sets/:setId"
						render={props => (
							<SetViewer
								onChangeKey={this.handleChangeKey}
								onSongMove={this.handleSongMove}
								onRemoveSet={this.handleRemoveSet}
								onRemoveSong={this.handleRemoveSong}
								set={currentSet}
								{...props}
							/>
						)}
					/>
					<Route
						exact
						path="/sets/:setId/songs/:songId"
						render={({ match }) => {
							const songId = match.params.songId

							const index = findIndex(currentSet.songs, { id: songId })
							const currentKey =
								currentSet && currentSet.songs[index]
									? currentSet.songs[index].key
									: null

							//TODO: catch errors where the set song key is empty

							return (
								<div>
									<SongContainer currentKey={currentKey} id={songId} />
								</div>
							)
						}}
					/>
				</div>
			)
		)
	}
}

const mapStateToProps = state => ({
	currentSet: state.currentSet
})

export default connect(
	mapStateToProps,
	actions
)(SetContainer)