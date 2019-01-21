import { call, put, select, takeEvery } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'
import slugify from 'slugify'
import map from 'lodash/fp/map'
import pick from 'lodash/fp/pick'

import { db } from '../../firebase'
import {
	ADD_SET,
	REMOVE_SET,
	UPDATE_SET,
	mergeSets,
	removeSet
} from '../actions'

const setsCollection = db.collection('sets')
const songsCollection = db.collection('songs')

const setsChannel = () =>
	eventChannel(emitter => {
		setsCollection.onSnapshot(querySnapshot => {
			const sets = []
			querySnapshot.forEach(doc => {
				sets.push({ id: doc.id, ...doc.data() })
			})
			emitter(sets)
		})
		return () => {}
	})

export function* setsSaga() {
	const setsChan = yield call(setsChannel)
	yield takeEvery(setsChan, handleSetsEvent)
	yield takeEvery(ADD_SET, handleAddSet)
	yield takeEvery(REMOVE_SET, handleRemoveSet)
	yield takeEvery(UPDATE_SET, handleUpdateSet)
}

function* handleAddSet({ payload: newSet }) {
	const state = yield select()
	newSet.author = state.user.name
	newSet.slug = slugify(newSet.title)
	newSet.songs = newSet.songs || []

	const set = yield setsCollection.add(newSet)
	yield put(
		mergeSets([
			{
				...newSet,
				id: set.id
			}
		])
	)
}

function* handleRemoveSet({ payload: setId }) {
	yield setsCollection.doc(setId).delete()
	yield put(removeSet(setId))
}

function* handleUpdateSet({ payload: set }) {
	if (set.title) {
		set.slug = slugify(set.title)
	}
	if (set.date) {
		set.setDate = set.date
	}

	const setSongs = []
	for (let i = 0; i < set.songs.length; i++) {
		const song = set.songs[i]
		const songDoc = yield songsCollection.doc(song.id).get()
		setSongs.push({
			id: song.id,
			key: song.key,
			ref: songDoc.ref
		})
	}

	set.songs = setSongs

	yield setsCollection.doc(set.id).update(set)
	yield put(mergeSets([set]))
}

function* handleSetsEvent(sets) {
	const formattedSets = map(set => {
		set.songs = map(song => pick(['id', 'key'])(song))(set.songs)
		return set
	})(sets)
	yield put(mergeSets(formattedSets))
}