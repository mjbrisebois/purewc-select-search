
import webpack			from 'webpack';
import TerserPlugin		from 'terser-webpack-plugin';


const MODE			= process.env.MODE || "development";
const FILENAME			= process.env.FILENAME || "purewc-select-search";
const FILEEXT			= MODE === "production" ? "min.js" : "js";


export default {
    "target":	"web",
    "mode":	MODE,
    "entry": {
	"main": {
	    "import":	"./src/index.js",
	    "filename":	`${FILENAME}.${FILEEXT}`,
	    "library": {
		"type":	"module",
	    },
	},
	"register": {
	    "import":	"./src/auto-register.js",
	    "filename":	`${FILENAME}.auto.${FILEEXT}`,
	    "library": {
		"type":	"window",
	    },
	},
    },
    "experiments": {
	"outputModule":	true,
    },
    "optimization": {
	"minimizer": [
	    new TerserPlugin({
		"terserOptions": {
		    "keep_classnames": true,
		},
	    }),
	],
    },
    "devtool":	"source-map",
    "stats": {
	"colors": true,
    },
    "plugins": [
        new webpack.optimize.LimitChunkCountPlugin({
	    "maxChunks": 1,
	}),
    ],
};
