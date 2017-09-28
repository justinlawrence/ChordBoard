import Router from 'preact-router';

class Navbar extends PreactComponent {
	state = {
		isViewingSong: false
	};

	componentDidMount() {

		this.setState( {
			isViewingSong: this._isViewingSong( Router.getCurrentUrl() )
		} );

		Router.subscribers.push( url => {

			this.setState( {
				isViewingSong: this._isViewingSong( url )
			} );

		} );

	}

	editCurrentSong = () => {

		const url = Router.getCurrentUrl();
		Router.route( `${url}/edit` );

	};

	setDefaultMode = () => {

		this.context.setMode( '' );
		Router.route( `/songs` );

	};

	render( { focusedSet, goToNextSong, goToPreviousSong, mode }, { isViewingSong } ) {

		return (
			<nav class="navbar is-light">
				<div class="navbar-brand">

					<a class="navbar-item" href='/'>
						<img src="/assets/chordboard-logo.png"
						     alt="Chordboard: a chord manager for live musicians"
						     width="142"/>
					</a>

					{mode === 'live' && [
						<p class="navbar-item">{focusedSet.title}</p>,
						<a class="navbar-item" onClick={goToPreviousSong}>
							<span class="icon"><i class="fa fa-angle-left"></i></span>
						</a>,
						<a class="navbar-item" onClick={goToNextSong}>
							<span class="icon"><i class="fa fa-angle-right"></i></span>
						</a>,
						<a class="navbar-item" onClick={this.setDefaultMode}>
							<span class="icon"><i class="fa fa-close"></i></span>
						</a>
					]}

					{mode === '' && [
						<a class="navbar-item" href="/songs">Songs</a>,
						<a class="navbar-item" href="/sets">Sets</a>
					]}

					{isViewingSong ?
						<a class="navbar-item" onClick={this.editCurrentSong}>
							Edit song
						</a>
						: null}

				</div>

			</nav>
		);

	}

	_isViewingSong = url => {

		return /songs\/[^/]+$/.test( url );

	};
}

export default Navbar;
