const ICONS = {
	'PLAY': '▶️',
	'PAUSE': '⏸',
	'STOP': '⏹',
	'REPEAT': '🔁',
	'REPEAT_ONCE': '🔂',
	'SHUFFLE': '🔀',
	'REWIND': '⏪',
	'FORWARD': '⏩',
	'PREVIOUS': '⏮',
	'NEXT': '⏭'
};

const __createElement = function (tag, props, ...children) {
	const element = document.createElement(tag);

	Object.keys(props).forEach(key => element[key] = props[key]);

	if (children.length > 0) {
		children.forEach(child => {
			if (typeof child === 'string') {
				child = document.createTextNode(child);
			}
			element.appendChild(child);
		});
	}
	return element;
};

export class FBXAnimationControls {

	static getAnimationTimeDisplayString(time) {
		if (time === undefined || isNaN(time)) throw new Error(`property 'time' can't be undefined or NaN`);

		let t = new Date(parseInt((time * 1000).toFixed(0)));

		let mm = t.getMinutes();
		mm = mm < 10 ? '0' + mm : mm;
		let ss = t.getSeconds();
		ss = ss < 10 ? '0' + ss : ss;
		let ms = (t.getMilliseconds() / 10).toFixed(0);
		ms = ms < 10 ? '0' + ms : ms;

		return `${mm}:${ss}:${ms}`;
	}

	__attachedMesh;
	__animationAction;
	__playAnimationFlag = false;
	__duration = '--:--:--';
	__innerContainer;
	__clock;

	constructor(domElement) {
		this.__innerContainer = domElement;
		if(window.THREE && window.THREE.Clock) {
			this.__clock = new window.THREE.Clock();
		} else {
			import {Clock} from 'three';
			this.__clock = new Clock();
		}

		// TODO: display type like mm:ss:ms or ss:ms (configurable from options passed in constructor)
		// TODO: Implement properties __attachedMesh & __playAnimationFlag as getter/setter
		this.__init();
	}

	__init() {
		this.animationSlider = __createElement('input', {
			type: 'range',
			min: 0,
			max: 100,
			step: 'any',
			className: 'animationSlider'
		});

		this.playButton = __createElement(
			'div',
			{className: 'playButton'},
			ICONS.PLAY
		);

		this.currentAnimationTime = __createElement(
			'p',
			{className: 'currentAnimationTime'},
			`--:--:-- / ${this.__duration}`
		);

		this.animationControlsContainer = __createElement(
			'div',
			{className: 'animationControlsContainer'},
			this.animationSlider, this.playButton, this.currentAnimationTime
		);

		this.__innerContainer.appendChild(this.animationControlsContainer);

		let status;

		this.animationSlider.addEventListener('mousedown', () => {
			status = this.__playAnimationFlag;
			this.pause();
		}, false);

		this.animationSlider.addEventListener('input', () => {
			this.setPercentage(this.animationSlider.value);
		}, false);

		this.animationSlider.addEventListener('mouseup', () => {
			if (status) this.play();
		}, false);

		this.playButton.addEventListener('click', () => {
			if (this.__playAnimationFlag) this.pause();
			else this.play();
		});
	}

	__isAnimationAvailable() {
		return this.__attachedMesh && this.__animationAction;
	}

	attach(mesh, attachOptions) {
		if (this.__attachedMesh !== mesh) {
			this.__attachedMesh = mesh;
			this.__attachedMesh.mixer = new THREE.AnimationMixer(mesh);
			this.__animationAction = this.__attachedMesh.mixer.clipAction(this.__attachedMesh.animations[0]);
			this.__duration = FBXAnimationControls.getAnimationTimeDisplayString(this.__animationAction.__clip.duration);
			if (attachOptions && attachOptions.needPlay) {
				this.play();
			}
		} else {
			throw new Error('already attached');
		}
	}

	detach() {
		this.__attachedMesh = undefined;
		this.__animationAction = undefined;
		this.currentAnimationTime.innerText = '--:--:--';
		this.animationSlider.value = '50';
		this.playButton.innerText = ICONS.STOP;
	}

	play() {
		if (this.__isAnimationAvailable()) {
			if (!this.__playAnimationFlag) {
				this.__playAnimationFlag = true;
				this.playButton.innerText = ICONS.PAUSE;
				this.__animationAction.paused = false;
			}
			if (!this.__animationAction.isRunning()) {
				this.__animationAction.play();
			}
		}
	}

	pause() {
		if (this.__isAnimationAvailable()) {
			if (this.__playAnimationFlag) {
				this.__playAnimationFlag = false;
				this.playButton.innerText = ICONS.PLAY;
				this.__animationAction.paused = true;
			}
		}
	}

	stop() {
		if (this.__isAnimationAvailable()) {
			if (this.__playAnimationFlag) {
				this.__playAnimationFlag = false;
				this.playButton.innerText = ICONS.STOP;
				this.__animationAction.paused = true;
				this.setPercentage(0);
			}
		}
	}

	setTime(time) {
	}

	setPercentage(percentage) {
		if (this.__isAnimationAvailable()) {
			this.__animationAction.time = (parseFloat(percentage) / 100) * this.__animationAction.__clip.duration;
			this.currentAnimationTime.innerText = this.getCurrentAnimationTimeDisplayString();
		}
	}

	getCurrentAnimationTimeDisplayString() {
		return `${FBXAnimationControls.getAnimationTimeDisplayString(this.__animationAction.time)} / ${this.__duration}`;
	}

	update() {
		if (this.__attachedMesh && this.__attachedMesh.mixer) this.__attachedMesh.mixer.update(this.__clock.getDelta());
		if (this.__animationAction && this.__playAnimationFlag) {
			this.currentAnimationTime.innerText = this.getCurrentAnimationTimeDisplayString();
			this.animationSlider.value =
				`${(this.__animationAction.time.toFixed(3) / this.__animationAction.__clip.duration) * 100}`;
		}
	}
}
