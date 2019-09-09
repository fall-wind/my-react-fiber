// const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
// const CleanWebpackPlugin = require('clean-webpack-plugin');

const webpackConfig = {
    mode: 'production',
    devtool: 'hidden-source-map',
    entry: {
        app: path.join(__dirname, './src/index.js'),
        // vendor: ['react', 'react-dom', 'react-router', 'redux', 'echarts', 'antd'],
    },
	output: {
		path: path.join(__dirname, './dist'),
	},
	plugins: [
        // new CleanWebpackPlugin(path.join(__dirname, './dist'), {
        //     root: path.join(__dirname, './dist'),
        // }),
		new HtmlWebpackPlugin({
			title: 'fiber',
			filename: 'index.html',
			template: path.resolve(__dirname, './index.html'),
			inject: 'body',
			chunksSortMode: 'none',
			hash: true,
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
	],
	module: {
		rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.less/,
                use: [
                    'style-loader',
                    'css-loader',
                    'less-loader',
                ],
            },
			{
				test: /\.(js|jsx)$/,
				loader: require.resolve('babel-loader'),
				options: {
					presets: [
						'@babel/preset-env',
						// "@babel/stage-0",
						'@babel/react',
					],
					plugins: [
						'@babel/plugin-proposal-class-properties',
						'@babel/plugin-proposal-function-bind',
						// ["@babel/plugin-proposal-decorators", { "decoratorsBeforeExport": true }],
						[
							'@babel/plugin-transform-react-jsx',
							{
								pragma: 'React.createElement',
							},
						],
					],
				},
				// exclude: path.join(__dirname, './src'),
				exclude: /node_modules/,
			},
		],
	},
};

module.exports = webpackConfig;
