// const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
// const rootPath = path.resolve(__dirname);
// const ROOT_PATH = path.resolve(__dirname);
const config = {
	port: 8181,
};

const webpackConfig = {
	mode: 'development',
	devtool: 'cheap-eval-source-map',
	entry: [
		`webpack-dev-server/client?http://127.0.0.1:${config.port}`,
		// 'webpack/hot/only-dev-server',
		'webpack/hot/dev-server',
		path.join(__dirname, './src/index'),
		// '../src/index.js',
	],
	output: {
		path: path.join(__dirname, './dist'),
	},
	plugins: [
		// new HtmlWebpackPlugin({
		//     template: `${__dirname}/src/index.html`, // 源html
		//     inject: 'body', // 注入到哪里
		//     filename: 'index.html', // 输出后的名称
		//     hash: true, // 为静态资源生成hash值
		// }),
		// new CleanWebpackPlugin(['dist']),
		new HtmlWebpackPlugin({
			title: 'fiber',
			filename: 'index.html',
			template: path.resolve(__dirname, './index.html'),
			inject: 'body',
			chunksSortMode: 'none',
			hash: true,
		}),
	],
	devServer: {
		contentBase: path.join(__dirname, './src'), // 从哪提供内容
		historyApiFallback: true,
		hot: true,
		port: config.port,
		publicPath: config.publicPath,
		noInfo: false,
		disableHostCheck: true,
	},
	module: {
		rules: [
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
