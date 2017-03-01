/**
 * Crud Controller
 * @param  {window} window Window
 * @param  {riot}   riot    Riot.js
 * @param  {[type]} $script [description]
 * @return {[type]}         [description]
 */
;
(function(window, riot, route, $script) {
    'use strict';

    var currentTag = null;
    var currentName = null;
    var dependencies = {};
    var routes = {};
    var menuGroups = {
        default:{
            html: false,
            routes: {}
        }
    };
    var target = '#content';
    var options = {
            target: '#main',
            options:{},
            query:{}
        };

    /**
     * Riot Crud Controller Constructor
     * @return {function}   Self
     */
    function riotCrudController() {
        return this;
    }

    /**
     * Riot Crud Controller Api
     */
    riotCrudController.prototype = {

        defaults: (config) => {
            options = Object.assign({}, options, config);
            return this;
        },

        addRoute: (path, config) => {
            config = Object.assign({}, options, config);
            routes[path] = config;
            // if(config.menu) {
            //     menuGroups[config.menuGroup || 'default'].routes = {

            //     };
            // }
            return this;
        },

        addMenuGroup: (key, opts) => {
            // menuGroups[key] = {html: html, routes: {}}
            menuGroups[key] = Object.assign({}, opts, {routes: {}})
        },

        getRoutes: () => {
            return routes;
        },

        getRouteMenu: () => {
            for (var k in routes){
                if (routes[k].menu) {
                   menuGroups[routes[k].menuGroup || 'default'].routes[k] = routes[k];
                }
            }
            return menuGroups;
        },

        addDependencies: (view, d) => {
            dependencies[view] = d;
            return this;
        },

        loadDependencies: (dependencies, tag, cb) => {
            var dep = [];
            if(typeof dependencies != 'undefined')
                dep = dependencies;

            if ($script &&  dep.length > 0) {
                $script(dep,  () => {
                    if(typeof cb === 'function') {
                        cb();
                    }
                });
            } else {
                if(typeof cb === 'function') {
                    cb();
                }
            }
        },

        start: (path) => {
            route.parser(handler);
            route.start(true);
            if (route)
                route(path);

            return this;
        },

    }

    function mount(target, tag, options) {
        if(
            currentTag!=null && tag == currentTag.root.getAttribute('data-is')
            && options.model == currentTag.opts.model
            ) {
            currentTag.refresh(options);
        } else {
            currentTag && currentTag.unmount(true)
            currentTag = riot.mount(target, tag, options)[0]
            currentName = tag
        }
    }

    /**
     * Routing handler
     * @param  {string}  collection Collection name
     * @param  {string}  action     Action type (optional)
     * @param  {integer} params     Params (optional)
     *
     * - exec fn
     */
    function handler(collection, action, param) {

        var raw = collection.split('?'),
              uri = raw[0].split('/'),
              qs = raw[1],
              params = {}

        if (qs) {
            qs.split('&').forEach(function(v) {
                var c = v.split('=')
                params[c[0]] = c[1]
            })
        }

        var collection = uri[0];
        var action = uri[1];
        var param = uri[2];

        // uri.push(params)
        // return uri;


        if (typeof routes[collection] == 'undefined' && typeof routes[collection+action] == 'undefined') {
            console.error('RiotCrudController no route found',{
                collection: collection,
                action: action,
                param: param,
                routes: routes,
                uri:uri,
                qs:qs,
                params:params,
                           });
            return;
        }

        var view = routes[collection] || routes[collection+action];

        view.query = {id: param, query: route.query()};
        RiotCrudController.loadDependencies(view.dependencies, view.route, function() {

            RiotControl.trigger('routeStateChange',view.route);

            if (typeof view.fn === 'function') {
                currentName = null;
                currentTag = null;
                view.fn(collection, param, action);
            } else {
                mount(
                    view.target || target,
                    view.tag || collection + '-' + action,
                    view
                );
            }
        })
    }

    if (!window.RiotCrudController) {
        window.RiotCrudController = new riotCrudController;
    }

}(window, riot, route, $script));

/**
 * Riot crud model
 * @param  {[type]} window [description]
 * @param  {[type]} riot   [description]
 * @param  {[type]} qwest  [description]
 * @return {[type]}        [description]
 */
;(function(window, riot, $) {
    'use strict';

    function riotCrudModel() {
        this.opts = {
            idfield:'_id',
            showheader: true,
            showpagination: true,
            changelimit: true,
        };
    }

    riotCrudModel.prototype = {

        defaults: function(o) {
            this.opts = $.extend( this.opts, o || {} );
            return this;
        },

        addModel: function(name, config, views) {

            var options = $.extend({model:name}, this.opts, config || {} );

            for (var view in views) {
                var model = $.extend({name: name, route: name + '/' + view}, options, views[view]);
                model.view = view;
                model.views = Object.keys(views);
                RiotCrudController.addRoute(name+view,model);
            }

            return this;
        }
    }

    window.RiotCrudModel = new riotCrudModel();
}(window, riot, $));

/**
 * riotCrudViewMixins
 * @param  {[type]} riot [description]
 * @return {[type]}      [description]
 */
;
(function(window, riot, route, $script) {

    window.RiotControl = {
        _stores: [],
        addStore: function(store) {
            this._stores.push(store);
        },
        reset: function() {
            this._stores = [];
        }
    };

    ['on','one','off','trigger'].forEach(function(api){
        RiotControl[api] = function() {
            var args = [].slice.call(arguments);
            this._stores.forEach(function(el){
                el[api].apply(el, args);
            });
        };
    });

    if (typeof(module) !== 'undefined') module.exports = RiotControl;

    function ModelStore() {
        if (!(this instanceof ModelStore)) return new ModelStore()

        riot.observable(this)

        var self = this;

    }

    RiotControl.addStore(new ModelStore());

    riot.mixin("FeatherClientMixin", {
        init: function(){
            var defaults = {
                idfield: '_id',
                dependencies: []
            };

            Object.assign(this.opts, defaults);

            this.socket = io(this.opts.endpoint || 'http://' + window.location.hostname + ':3030');
            this.client = feathers()
              .configure(feathers.hooks())
              .configure(feathers.socketio(this.socket));

            /* init feathers service */
            if(typeof this.opts.service != 'undefined' && this.opts.view) {

                this.service = this.client.service(this.opts.service);

                var viewModelKey = [this.opts.service, this.opts.view].join('_');
                this.eventMap = {
                    actionDeleteConfirmation: viewModelKey + '_delete_confirmation',
                    actionDeleteConfirmed: viewModelKey + '_delete',
                    actionEditSave: this.opts.service + '_save',
                    actionCreateSave: this.opts.service + '_create',
                    actionQuery: this.opts.service + '_query',
                }

                if(this.opts && this.opts.view && this.opts.view == 'list') {
                    this.eventMap['actionDownload'] = this.opts.service + '_download';
                }

                /*  events */
                this.on('*', (event) => {
                    switch(event) {
                        case 'mount':
                            break;
                        case 'before-mount':
                        case 'unmount':
                            if(event == 'before-mount') {
                                this.loadDependencies();
                            }
                            var map = Object.keys(this.eventMap);
                            for (var i = 0; i < map.length; i++) {
                                if(event == 'unmount') {
                                    RiotControl.off(this.eventMap[map[i]]);
                                } else {
                                    this.bindEvent(this.eventMap[map[i]], map[i]);
                                }
                            }
                            break;
                        default:
                            if(this.debug) console.info('FeatherClientMixin event:' + event, this.opts.title)
                            break;
                    }
                })

            } else {
                if(this.debug) console.warn('FeatherClientMixin no service', this.root.tagName);
            }
        },

        loadDependencies: function ()  {
            var self = this;
            if(!self.dependencies || (self.dependencies && self.dependencies.length == 0)) {
                self.loadSchema();
            } else {
                var bundle = self.root.tagName + self.opts.service + self.opts.view + self.opts.title;
                if (self.debug) console.log('loadDependencies', self.root.tagName, self.opts.title,bundle, self.dependencies)
                $script(self.dependencies,bundle);
                $script.ready(bundle, function() {
                    self.loadSchema();
                })
            }
        },

        loadSchema: function () {
            var self = this;
            if(self.opts.schema === true) {
                self.service.get('schema').then((result) => {
                    self.opts.schema = result;
                    self.loadData(self.opts.query);
                }).catch((error) => {
                    console.error('loadSchema', error);
                });
            } else {
                self.loadData(self.opts.query);
            }
        },

        loadData: function (query) {
            var self = this;
            console.log('loadData', self.opts.title, self.opts.schema, self.opts)
            switch(self.opts.view) {
                case 'view':
                case 'edit':
                    if(query.id)
                    self.service.get(query.id).then(function(result){
                        self.data = result;

                        if(typeof self.updateView == 'undefined') {
                            self.update();
                        } else {
                            self.updateView();
                        }
                    }).catch(function(error){
                      console.error('loadData', error);
                    });
                    break;
                case 'list':
                    self.service.find(query).then(function(result){
                        self.data = result;
                        if(typeof self.updateView == 'undefined') {
                            self.update();
                        } else {
                            self.updateView();
                        }
                    }).catch(function(error){
                      console.error('loadData', error);
                    });
                    break;
                default:
                    break;
            }
        },

        bindEvent: function (event, fn) {
            var self = this;
            RiotControl.on(event, function(e){
                if(this.debug) {
                    console.info(map[i], this.eventMap[map[i]], e, self.opts, self.eventMap,Object.keys(self))
                }
                self[fn](e);
            });
        },

        actionQuery: function(id) {
            if(this.opts.view == 'list')
                return;
            this.loadData({id:id});
        },

        actionDeleteConfirmation: function (id) {
            console.info('actionDeleteConfirmation',id,this.data)
            RiotControl.trigger('delete_confirmation_modal', this.opts.service, this.opts.view, id || this.data._id || this.selection)
            // RiotControl.trigger('delete_confirmation_modal', this.opts.service, this.opts.view, id || this.opts.query.id || this.selection)
        },

        actionDeleteConfirmed: function (id) {
            var self = this;
            if(typeof id === "object") {
                var ids = id.map(function(_id){return _id.toString()});
                var query = {query:{ _id: { $in: ids}}};
                id  = null;
            }

            self.service
                .remove(id,query)
                .then(function(result){
                    if(self.opts.view != 'list') {
                        route([self.opts.service, 'list'].join('/'))
                    } else {
                        self.refresh();
                    }
                })
                .catch(function(error){
                    console.error(error);
                    RiotControl.trigger('notification',error.errorType + ' ' + self.eventMap.actionDeleteConfirmed,'error',error.message);
                });
        },

        actionEditSave: function () {
            var self = this;
            console.error(self.opts.service);
            var data = self.getData();
            if(data == false) return false;

            self.service
                .update(data[self.opts.idfield],data)
                .then(function(result){})
                .catch(function(error){
                    RiotControl.trigger('notification',error.errorType + ' ' + self.eventMap.actionEditSave,'error',error.message);
                });
        },

        actionCreateSave: function () {
            var self = this;
            var data = self.getData();
            if(data == false) return false;

            delete data._id;
            delete data.id;
            console.error('actionCreateSave',data)
            self.service
                .create(data)
                .then(function(result){})
                .catch(function(error){
                    console.error(error)
                    RiotControl.trigger('notification',error.errorType + ' ' + self.eventMap.actionCreateSave,'error',error.message);
                });
        },

        actionDownload: function (format) {
            // RiotControl.trigger([service, 'download','action'].join('_'));
            var uri = "http://" +  window.location.hostname + ":3030/download/" + format + "/" + this.opts.service;
            var query = this.query;
            if(this.selection && this.selection.length > 0) {
                var ids = this.selection.map(function(_id){return _id.toString()});
                // var query = { _id: { $in: ids}};
                query = Object.assign({},query, { _id: { $in: ids}});
                query.$limit = this.selection.length;
                // console.info($.param(query))
                // uri += '?' + decodeURIComponent($.param(query));
            } else {
                query.$limit = this.data.total;
            }
            uri += '?' + JSON.stringify(query);
            console.info(query, uri)
            window.location = uri;

        }
    });

    riot.mixin("ViewActionsMixin", {
        init: function(){
            var actions = ['View','Edit','Create','Delete','Save','List','Print','PDF','CSV','Json','Upload'].map((action, index) => {
                return {name: action.toLowerCase(), label: action};
            });

            this.on('*', (event) => {
                var self = this;

                if(event == 'before-mount' || event == 'update') {
                    var  view = this.opts.view || 'undefined';
                    this.opts.actions = actions.map((action, index) => {

                        action.active = false;
                        if(['delete','print','pdf','csv','json'].indexOf(action.name) != -1){
                            action.count = self.opts.selection || 'all';
                        }

                        switch(view) {
                            case 'view':
                                if(['edit','delete','create','list'].indexOf(action.name) != -1){
                                    action.active = true;
                                    delete action.count;
                                }
                                break;
                            case 'edit':
                                if(['save','view','delete','list'].indexOf(action.name) != -1){
                                    action.active = true;
                                    delete action.count;
                                }
                                break;
                            case 'create':
                                if(['save','list'].indexOf(action.name) != -1){
                                    action.active = true;
                                }
                                break;
                            case 'list':
                                if(['delete','create','print','pdf','csv','json','upload'].indexOf(action.name) != -1){
                                    action.active = true;
                                }
                                break;
                            default:
                                break;

                        }

                        if(self.opts.buttons && self.opts.buttons[action.name]) {
                            action.active = true;
                        }

                        return action;
                    });
                }
            })
        },

        actionClick: function (e) {
            e.preventDefault();
            if(e.item.action.count === 0) {
                return;
            }
            var service = this.opts.service || this.opts.name; // TODO: move name
            var view = this.opts.view;
            var action = e.item.action.name;
            console.info(Object.keys(e.item));
            switch(action){
                case 'delete':
                    var event = [service, view, action,'confirmation'].join('_');
                    RiotControl.trigger(event);
                    break;
                case 'save':
                case 'update':
                    if(view == 'create'){
                        action = 'create';
                    }
                    var event = [service, action].join('_');
                    RiotControl.trigger(event);
                    break;
                case 'view':
                case 'edit':
                    route([service, action, this.opts.query.id].join('/'))
                    break;
                case 'list':
                case 'create':
                    route([service, action].join('/'))
                    break;
                case 'upload':
                    RiotControl.trigger([service, 'upload','modal'].join('_'));
                    break;
                case 'csv':
                case 'json':
                    RiotControl.trigger([service, 'download'].join('_'), action);
                    // window.location = "http://" +  window.location.hostname + ":3030/download/" + action + "/" + service;
                    break;
                default:
                    console.error('unknown event: ' + [service, view, action].join('_'))
                    break;
            }
        }
    });


}(window, riot, route, $script));
