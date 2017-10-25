import './bootstrap'

import {render} from 'preact';
import {BrowserRouter} from 'react-router-dom';
import {Provider} from 'preact-redux'

import configureStore from 'app/configureStore'
import App from 'app/app';

import './styles/main.scss';

const store = configureStore();

render(
	<Provider store={store}>
		<BrowserRouter>
			<App/>
		</BrowserRouter>
	</Provider>,
	document.querySelector( 'main' ) );

