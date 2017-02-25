// background script

var isDEV = true;

var log_storage = () => {
	browser.storage.local.get().then( thing => {
		if (isDEV) console.log(thing);
	});
};

var getOptions = (request, sendBack) => {
	browser.storage.local.get().then( local_obj => {
		var {setting} = local_obj;
		sendBack({ setting: setting });
	}).catch(e => console.warn(e));
	return true;
};

var setOptions = (request, sendBack) => {
	browser.storage.local.get().then( local_obj => {
		log_storage();
		if (local_obj.setting === undefined) {
			if (isDEV) console.log('creating setting');
			local_obj.setting = {};
		}
		local_obj.setting[request.key] = request.val;
		browser.storage.local.set(local_obj);
		log_storage();
		sendBack({ msg: 'done'});
	}).catch(e => console.warn(e));
	return true;
};

browser.runtime.onMessage.addListener( (request, sender, sendBack) => {

	if (isDEV) console.log(request.behavior);
	switch(request.behavior) {
		case 'set_options':
			setOptions(request, sendBack);
			break;
		case 'get_options':
			getOptions(request, sendBack);
			break;
		case 'init':
			if (isDEV) console.log('bg_init');

			if (isDEV) console.log(request.url);
			browser.tabs.query({url: request.url}).then((tab_infos) => {
				tab_infos.forEach(tab_info => {
					browser.pageAction.show(tab_info.id);
				});
			}).catch(e => console.warn(e));

			browser.storage.local.get().then( local_obj => {
				log_storage();
				if (local_obj[request.url] === undefined) {
					if (isDEV) console.log('creating record');
					local_obj[request.url] = {};
					for (var i = 0 ; i < request.ta_num ; ++i) {
						local_obj[request.url][i] = { val: "" };
					}
					for (var i = 0 ; i < request.ifr_num ; ++i) {
						local_obj[request.url]['w-'+i] = { val: "" };
					}
					local_obj[request.url].length = request.ta_num;
					local_obj[request.url].ifr_length = request.ifr_num;
					browser.storage.local.set(local_obj);
					log_storage();
				}
			}).catch(e => console.warn(e));
			break;
		case 'save':
			if (isDEV) console.log('bg_save');
			browser.storage.local.get().then( local_obj => {
				var {url, val, id} = request;

				local_obj[url] = local_obj[url] || {};
				local_obj[url][id] = local_obj[url][id] || {};
				local_obj[url][id].val = val;
				browser.storage.local.set(local_obj);

				log_storage();
			}).catch(e => console.warn(e));
			break;
		case 'load':
			if (isDEV) console.log('bg_load');

			browser.tabs.query({active:true}).then( tabs => {
				browser.tabs.sendMessage(tabs[0].id, 'url').then( res => {
					browser.storage.local.get().then( data => {
						sendBack({ data: data[res.url] });
					});
				}).catch(e => console.warn(e));
			}).catch(e => console.warn(e));

			break;
		case 'clear':
			if (isDEV) console.log('bg_clear');
			browser.storage.local.clear().then( () => {
				log_storage();
				sendBack({ msg: 'done'});
			}).catch(e => console.warn(e));
			break;
	}

	return true;
});

