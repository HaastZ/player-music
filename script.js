const ctx = new AudioContext(),
	gain = ctx.createGain(),
	ABSNs = [],
	audioTimecut = 2.6,
	nfLoopSamples_ = Math.floor( .3 * ctx.sampleRate ),
	nfLoopSamples = nfLoopSamples_ % 2 ? nfLoopSamples_ - 1 : nfLoopSamples_,
	nfLoop = ctx.createBuffer( 2, nfLoopSamples * 2, ctx.sampleRate ),
	elVideo = document.querySelector( "video" ),
	elLines = document.querySelector( "#lines" ),
	elStart = document.querySelector( "#start" ),
	elStartMute = document.querySelector( "#startMute" );

let nfAudio,
	frameId,
	goLeft = true;

gain.connect( ctx.destination );
gain.gain.setValueAtTime( 1, ctx.currentTime );

elVideo.addEventListener( "loadeddata", start );
fetch( "https://mr21.github.io/_/netflix-logo.mp4" )
	.then( res => res.arrayBuffer() )
	.then( arr => ctx.decodeAudioData( arr ) )
	.then( buf => {
		nfAudio = buf;
		for ( let chan = 0; chan < 2; ++chan ) {
			const nfArr = nfAudio.getChannelData( chan ),
				loopArr = nfLoop.getChannelData( chan );

			for ( let i = 0; i < nfLoopSamples; ++i ) {
				loopArr[ loopArr.length - 1 - i ] =
				loopArr[ i ] = nfArr[ audioTimecut * ctx.sampleRate + i ];
			}
		}
		start();
	} );

document.body.onclick = () => ctx.resume();
elStart.onclick = () => restart( true );
elStartMute.onclick = () => restart( false );

const colors = [
	"#ea3d00",
	"#085bc2",
	"#0071dc",
	"#e3ba37",
	"#996c96",
	"#e77d52",
	"#e5bd0f",
	"#072ea7",
	"#bd2d2d",
	"#f55632",
	"#dc9c47",
];

function start() {
	if ( elVideo.readyState >= 2 && nfAudio ) {
		elStart.removeAttribute( "disabled" );
		elStartMute.removeAttribute( "disabled" );
		restart( false );
	}
}

function restart( withSound ) {
	if ( withSound ) {
		ctx.resume();
		if ( ctx.state !== "running" ) {
			return;
		}
		startAudio();
	} else {
		stopAudio();
	}
	clearTimeout( frameId );
	elLines.style.opacity = 0;
	elVideo.volume = 0;
	elVideo.currentTime = 0;
	elVideo.play();
	frameId = setTimeout( () => {
		elLines.style.opacity = 1;
		frame();
	}, 2.7 * 1000 );
}

function startAudio() {
	if ( ctx.state === "running" ) {
		const absnIntro = ctx.createBufferSource(),
			absnLoop = ctx.createBufferSource(),
			now = ctx.currentTime;

		stopAudio();
		absnIntro.buffer = nfAudio;
		absnIntro.connect( gain );
		absnIntro.start( now, 0, audioTimecut );
		absnLoop.loop = true;
		absnLoop.buffer = nfLoop;
		absnLoop.connect( gain );
		absnLoop.start( now + audioTimecut );
		ABSNs.push( absnIntro, absnLoop );
	}
}
function stopAudio() {
	ABSNs.forEach( absn => absn.stop() );
}

function frame() {
	createLine();
	frameId = setTimeout( frame, Math.random() * 70 );
}

function getColor() {
	return colors[ Math.floor( Math.random() * colors.length ) ];
}

function createLine() {
	const elLine = document.createElement( "div" ),
		w = .2 + 1.5 * Math.random(),
		bez = 1 - .5 * Math.random(),
		dur = .2 + .9 * Math.random(),
		shadW = w * 50;

	elLine.classList.add( "line" );
	elLine.style.setProperty( "--w", `${ w }%` );
	elLine.style.setProperty( "--bez", bez );
	elLine.style.setProperty( "--dur", `${ dur }s` );
	elLine.style.setProperty( "--col", getColor() );
	elLine.style.setProperty( "--shadW", `${ shadW }px` );
	elLines.append( elLine );
	setTimeout( createLineAfter.bind( null, elLine ), 50 );
	setTimeout( () => elLine.remove(), dur * 2 * 1000 );
}

function createLineAfter( elLine ) {
	elLine.classList.add( goLeft ? "line-l" : "line-r" );
	goLeft = !goLeft;
}
