
import * as server from '@minecraft/server';
import * as ui from '@minecraft/server-ui';

import { world, system, ItemStack, Player, Dimension } from '@minecraft/server';
import { MessageFormData, ModalFormData } from '@minecraft/server-ui';

const FormattingCodes = {
	black: '§0',
	dark_blue: '§1',
	dark_green: '§2',
	dark_aqua: '§3',
	dark_red: '§4',
	dark_purple: '§5',
	gold: '§6',
	gray: '§7',
	dark_gray: '§8',
	blue: '§9',
	green: '§a',
	aqua: '§b',
	red: '§c',
	light_purple: '§d',
	yellow: '§e',
	white: '§f',
	minecoin_gold: '§g',
	material_quartz: '§h',
	material_iron: '§i',
	material_netherite: '§j',
	material_redstone: '§m',
	material_copper: '§n',
	material_gold: '§p',
	material_emerald: '§q',
	material_diamond: '§s',
	material_lapis: '§t',
	material_amethyst: '§u',
	obfuscated: '§k',
	bold: '§l',
	strikethrough: '§m', //Not supported
	underline: '§n', //Not supported
	italic: '§o',
	reset: '§r'
}
const cmdTypes = ['command', 'javascript', 'message'];

const Dimensions = {
	overworld: world.getDimension('minecraft:overworld'),
	nether: world.getDimension('minecraft:nether'),
	the_end: world.getDimension('minecraft:the_end')
}

class cmd_and_type {
	constructor(player, ttype) {
		this.player = player;
		this.ttype = ttype;
	}
	valueOf() {
		return {cmd: this.cmd, type: this.type};
	}
	get cmd() {
		try {
			return this.player.getDynamicProperty(this.ttype + '_cmd');
		} catch(error) {
			return this._cmd??undefined;
		}
	}
	set cmd(value) {
		this._cmd = value;
		try {
			this.player.setDynamicProperty(this.ttype + '_cmd', value);
		} catch(error) {}
		return value;
	}
	get type() {
		try {
			return this.player.getDynamicProperty(this.ttype + '_type')??1;
		} catch(error) {
			return this._type??1;
		}
	}
	set type(value) {
		this._type = value;
		try {
			this.player.setDynamicProperty(this.ttype + '_type', value);
		} catch(error) {}
		return value;
	}
}

class Global{
	constructor(player) {
		this.player = player;
	}
	get is_save() {
		try {
			return this.player.getDynamicProperty('is_save')??true;
		} catch(error) {
			return this.save??true;
		}
	}
	set is_save(value) {
		this.save = value;
		try {
			this.player.setDynamicProperty('is_save', value);
		} catch(error) {}
		return value;
	}
	get is_debug() {
		try {
			return this.player.getDynamicProperty('is_debug')??false;
		} catch(error) {
			return this.debug??true;
		}
	}
	set is_debug(value) {
		this.debug = value;
		try {
			this.player.setDynamicProperty('is_debug', value);
		} catch(error) {}
		return value;
	}
	get is_success() {
		try {
			return this.player.getDynamicProperty('is_success')??false;
		} catch(error) {
			return this.success??false;
		}
	}
	set is_success(value) {
		this.success = value;
		try {
			this.player.setDynamicProperty('is_success', value);
		} catch(error) {}
		return value;
	}
	get tab_width() {
		try {
			return this.player.getDynamicProperty('tab_width')??4;
		} catch(error) {
			return this._tab_width??4;
		}
	}
	set tab_width(value) {
		this._tab_width = value;
		try {
			this.player.setDynamicProperty('tab_width', value);
		} catch(error) {}
		return value;
	}
}

class runCmd extends Global{
	constructor(player) {
		super(player);
		this.last = new cmd_and_type(player, 'last');
		this.now = new cmd_and_type(player, 'now');
	}
	msg(_msg) {
		this.player.sendMessage(_msg);
	}
	cmd(_cmd) { 
		return this.player.runCommand(_cmd);
	}
	err(...msgs) {
		let m = FormattingCodes.italic + FormattingCodes.dark_red;
		let l = msgs.length;
		for(let i = 0; i < l; i++)
			m += msgs[i];
		m += FormattingCodes.reset;
		//this.msg(m);
		this.alert(m);
	}
	debugMsg(...msgs) {
		if(this.is_debug) this.send(msgs);
	}
	playerRunCmd(callback) {
		callback ??= is_success => {};
		this.is_success = false;
		new ModalFormData()
			.title('Run Command')
			.textField('CMD', ' Command', this.last.cmd)
			.toggle('save', this.is_save)
			.toggle('debug', this.is_debug)
			.dropdown('type', cmdTypes, this.last.type)
			.show(this.player)
			.then(formData => {
				this.is_success = true;
				if(formData.canceled) return;
				this.is_debug = formData.formValues[2];
				if(this.is_save = formData.formValues[1]) {
					this.last.cmd = formData.formValues[0];
					this.last.type = formData.formValues[3];
				}
				this.runCmd(this.now.cmd = formData.formValues[0], this.now.type = formData.formValues[3]);
				callback(true);
			})
			.catch(error => {
				if(!this.is_success) return;	
				this.err('Error: Failed to run cmd(', cmdTypes[this.now.type], '):\n', this.now.cmd, '\n', error);
				callback(false);
			});
	}
	runCmd(str, cmdType) {
		if(str!='') switch(cmdType) {
			case 0:
				this.Message(str, ': ', this.cmd(str));
				break;
			case 1:
				this.Message(str, ': ', eval(str));
				break;
			case 2:
				msg(str);
				break;
			default:
				err('Error: Not supported command type: ', cmdType);
		}
	}
	send(msgs) {
		return send(msgs, this.player);
	}
	Message(...msgs) {
		this.send(msgs);
	}
	alert(...msgs) {
		if(this.is_debug) return alert(this.player, ...msgs);
		return this.send(msgs);
	}
	_alert(...msgs) {
		return alert(this.player, ...msgs);
	}
}

try {
	(()=>{
		let i_cmd_stick_use = obj => {
			if(obj.itemStack.typeId == "minecraft:stick" && obj.itemStack.nameTag == "i:cmd_stick") {
				obj.cancel = true;
				system.run(() => {
					new runCmd(obj.source??obj.player).playerRunCmd();
				});
			}
		};
		world.beforeEvents.itemUse.subscribe(i_cmd_stick_use);
		world.beforeEvents.itemUseOn.subscribe(i_cmd_stick_use);
		world.beforeEvents.playerInteractWithBlock.subscribe(i_cmd_stick_use);
		world.beforeEvents.playerInteractWithEntity.subscribe(i_cmd_stick_use);
	})();
} catch (error) {
	if(error.name != 'TypeError')
		err(error);
}

function msg(_msg, player) {
	(player??world).sendMessage(_msg);
}

function cmd(_cmd, player) { 
	return (player??world.getDimension('minecraft:overworld')).runCommand(_cmd);
}

function cmd2(_cmd, player) { 
	let res = { successCount: 0 };
	if(player == undefined) {
		let players = world.getAllPlayers();
		for(let player of players)
			res.successCount += player.runCommand(_cmd).successCount;
	} else res = player.runCommand(_cmd);
	return res;	
}

function err(...msgs) {
	let m = FormattingCodes.italic + FormattingCodes.dark_red;
	let l = msgs.length;
	for(let i = 0; i < l; i++)
		m += msgs[i];
	msg(m + FormattingCodes.reset);
}

function debugMsg(player, ...msgs) {
	player ??= world;
	if(new Global(player).is_debug) send(msgs, player);
}

function makeTab(tabs) {
	let m = '';
	for(let i = 0; i < tabs; i++)
		m += ' ';
	return m;
}

function format(data, tab_width, tabs, isBase) {
	let m = '';
	let isFirst = true;
	tab_width ??= 4;
	tabs ??= 0;
	isBase ??= true;
		
	switch(Object.prototype.toString.call(data)) {
		case '[object Object]':
			if(isObjectEmpty(data)) {
				m += '{}'
				break;
			}
			m += (isBase ? '' : '\n') + makeTab(tabs) + '{';
			tabs += tab_width;
			for(let key in data) {
				m += '\n' + makeTab(tabs) + key + ': ' + format(data[key], tab_width, tabs, false);
				isFirst = false;
			}
			m += '\n' + makeTab(tabs-tab_width) + '}';
			break;
		case '[object Array]':
			if(isObjectEmpty(data)) {
				m += '[]';
				break;
			}
			m += (isBase ? '' : '\n') + makeTab(tabs) + '[';
			tabs += tab_width;
			for(let d of data) {
				m += '\n' + makeTab(tabs) + format(d, tab_width, tabs, true);
				isFirst = false;
			}
			m += '\n' + makeTab(tabs-tab_width) + ']';
			break;
		case '[object Null]':
			m += FormattingCodes.italic + FormattingCodes.dark_gray + '(null)' + FormattingCodes.reset;
			break;
		case '[object Undefined]':
			m += FormattingCodes.italic + FormattingCodes.dark_gray + '(undefined)' + FormattingCodes.reset;
			break;
		case '[object Function]':
			if(/\[native code\]/.test(data+''))
				m += FormattingCodes.italic + FormattingCodes.aqua + '(function)' + FormattingCodes.reset;
			else
				m += formatFunctionStr(data+'', tabs, tab_width);
			break;
		case '[object String]':
		case '[object Number]':
		case '[object Boolean]':
			m += FormattingCodes.aqua + data + FormattingCodes.reset;
			break;
		case '[object RegExp]':
			m += FormattingCodes.gold + data + FormattingCodes.reset;
			break;
		default:
			m += data;
	}
	return m;
}

function send(msgs, player, tab_width) {
	let m = '';
	player ??= world;
	tab_width ??= new Global(player).tab_width;
	for(let _msg of msgs)
		m += format(_msg, tab_width);
	player.sendMessage(m);
	return m;
}

function Message(...msgs) {
	return send(msgs);
}

function MessageToPlayer(player, ...msgs) {
	return send(msgs, player);
}

function isObjectEmpty(obj) {
	for (let key in obj)
		return false;
	return true;
}

function formatFunctionStr(str, tabs, tab_width) {
	let res = '';
	const LINE_TAB = (tabs == undefined ? '' : makeTab(tabs));
	const TAB = makeTab(tab_width??4);
	
	//格式化 颜色
	//let matches = str.matchAll(/((?<![A-Za-z0-9_.])(var|let|function|for|in|of|if|else|return|switch|case|while|undefined|null|default|break|true|false)(?![A-Za-z0-9_.]))|((?<![A-Za-z_])[0-9.](?![A-Za-z_]))|(\/\/.*|\/\*[^\/]*\*\/)|([\+\-\*\/\(\)\[\]\{\}\|\!\?\:\.\,\~\%\=])|((?<![A-Za-z0-9_.])(\/.*\/[gimsuy]?))/g);
	let matches = str.matchAll(/((?<![A-Za-z0-9_.])(var|let|function|for|in|of|if|else|return|switch|case|while|undefined|null|default|break|true|false)(?![A-Za-z0-9_\.]))|((?<![A-Za-z_])[0-9\.](?![A-Za-z_]))|(\/\/.*|\/\*[^\/]*\*\/)|(\W)|((?<![A-Za-z0-9_.])(\/[^(?<!\\)\/]*\/[gimsuy]?))/g);
	let last_match = 0;
	for(let match of matches) {
		res += str.substring(last_match, match.index);
		switch (match[0]) {
			case 'var':
			case 'let':
			case 'function':
			case 'for':
			case 'in':
			case 'of':
			case 'if':
			case 'else':
			case 'return':
			case 'switch':
			case 'case':
			case 'while':
			case 'undefined':
			case 'null':
			case 'default':
			case 'break':
				res += FormattingCodes.dark_purple;
				break;
			default:
				if(match[0][0]=='/')
					if(match[0][1]=='/'||match[0][1]=='*')
						res += FormattingCodes.italic + FormattingCodes.dark_green;
					else if(match[0][1]!=null)
						res += FormattingCodes.gold;
					else
						res += FormattingCodes.aqua;
				else
					res += FormattingCodes.aqua;
		}
		 res += match[0] + FormattingCodes.reset;
		last_match = match.index + match[0].length;
	}
	str = res + str.substring(last_match);
	
	//格式化 制表符/缩进
	res = '';
	matches = str.matchAll(/\t|\n/g);
	last_match = 0;
	for(let match of matches) {
		res += str.substring(last_match, match.index) + (match[0] == '\t' ? TAB : '\n' + LINE_TAB);
		last_match = match.index + 1;
	}
	return res + str.substring(last_match);
}

function alert(player, ...msgs) {
	let m = send(msgs, player);
	new MessageFormData()
		.title('breakpoint')
		.body(m)
		.button1('run command')
		.button2('continue')
		.show(player)
		.then(formData => {
			if (formData.canceled || formData.selection === undefined) return;
			if(formData.selection === 0) new runCmd(player).playerRunCmd();
		}).catch(error => {});
		return m;
}