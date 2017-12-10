"use strict";

// Load dependancies

const webpack = require('webpack'),
    path = require('path');

// Define configuration

module.exports = {
    entry: './js/index.js',
    output: {
        filename: '[name].min.js',
        path: path.resolve(__dirname, '../public', 'js')
    },
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['latest']
                    }
                }
            },
            {
                test: /\.json$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'json5-loader'
                }
            }
        ]
    },
    resolve: {
        alias: {
            globals: path.resolve(__dirname, 'js', 'globals.js')
        }
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({}),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: (module) => {
                var userRequest = module.userRequest;
                if (typeof userRequest !== 'string')
                    return false;
                return userRequest.indexOf('bower_components') >= 0 ||
                    userRequest.indexOf('node_modules') >= 0 ||
                    userRequest.indexOf('libraries') >= 0 ||
                    userRequest.indexOf('extensions') >= 0;
            }
        }),
        new webpack.optimize.OccurrenceOrderPlugin(true)
    ]
};
