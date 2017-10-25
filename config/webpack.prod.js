const webpackMerge = require( 'webpack-merge' );
const commonConfig = require( './webpack.base.js' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const OfflinePlugin = require( 'offline-plugin' );

module.exports = function ( env ) {

	return webpackMerge( commonConfig(), {
		module:  {
			loaders: [
				{
					test: /\.scss$/,
					use:  ExtractTextPlugin.extract( {
						fallback: 'style-loader?sourceMap',
						use:      [
							{
								loader:  'css-loader',
								options: {
									sourceMap: true
								}
							},
							{
								loader:  'sass-loader',
								options: {
									sourceMap: true
								}
							},
							{
								loader:  'postcss-loader',
								options: {
									sourceMap: 'inline',
									plugins:   function () {
										return [
											require( 'autoprefixer' )
										];
									}
								}
							},
						]
					} )
				}
			]
		},
		plugins: [
			new ExtractTextPlugin( '[name].css' ),
			new OfflinePlugin()
		]
	} );

};
