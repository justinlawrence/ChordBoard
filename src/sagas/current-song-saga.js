import { call, put, select, take, takeEvery } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga'

import { db, sync } from 'database';
import {
	SET_CURRENT_SONG_USER_KEY,
	setCurrentSong,
	setSong
} from 'actions'

export function* currentSongSaga() {
	yield takeEvery( SET_CURRENT_SONG_USER_KEY, updateCurrentSongUserKey );
}

function* updateCurrentSongUserKey( { key } ) {
	const { currentSong, user: currentUser } = yield select();

	const users = [ ...currentSong.users ].filter( u => typeof u === 'object' );
	const user = users.find( u => u.id === currentUser.id )
	if ( user ) {
		user.key = key;
	} else {
		users.push( { id: currentUser.id, key } );
	}

	yield put( setCurrentSong( { users } ) );

	const song = yield db.get( currentSong._id );
	song.users = users;
	yield db.put( song );
}

const syncChannel = type => eventChannel( emit => {
	sync.on( type, emit );
	return () => {};
} );

export function* songChanges() {
	const changesChannel = yield call( syncChannel, 'change' );
	while ( true ) {
		const { change } = yield take( changesChannel );
		const docs = change.docs;

		const songs = docs.filter( doc => doc.type === 'song' );
		for ( let i = 0; i < songs.length; i++ ) {
			const song = songs[ i ];
			yield put( setSong( song ) );
		}
	}
}