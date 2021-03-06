import filter from 'lodash/fp/filter'
import map from 'lodash/fp/map'

import { SET_CURRENT_SET, SET_CURRENT_SET_ID } from '../actions'

const filterEmpty = filter(item => Boolean(item))

const initialState = {
	id: null,
	songs: [],
}

export const currentSet = (state = initialState, action = {}) => {
	switch (action.type) {
		case SET_CURRENT_SET:
			return {
				...state,
				...action.set,
			}

		case SET_CURRENT_SET_ID:
			return {
				id: action.payload,
			}

		default:
			return state
	}
}

export const getSongsForCurrentSet = state =>
	state.currentSet.id
		? filterEmpty(
				map(song => state.songs.byId[song.id])(
					state.sets.byId[state.currentSet.id].songs
				)
		  )
		: []
