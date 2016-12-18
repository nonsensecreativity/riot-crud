var riotCrudTheme =
        location.search == '?theme=zurb' ?
        '/js/riotcrud/themes/zurb' :
        '/js/riotcrud/themes/bootstrap';

var dependencyList = {
    layout: [riotCrudTheme + '/menu.js', riotCrudTheme + '/dashboard.js', riotCrudTheme + '/views/crud-views.js'],
    login: riotCrudTheme + '/login.js',register: riotCrudTheme + '/register.js'
};

$script(dependencyList.layout, 'layout');

$script.ready('layout', function() {

    // var riotCrudTheme = '/js/riotcrud/themes/bootstrap'; //'/js/riotcrud/themes/zurb';


    // var dependencyList = {
    //     layout: [riotCrudTheme + '/menu.js', riotCrudTheme + '/dashboard.js', riotCrudTheme + '/views/crud-views.js'],
    //     dashboard: riotCrudTheme + '/login.js',register: riotCrudTheme + '/register.js'
    // };

    // var onLoadDependencies = [];

    // /*router util*/
    // $.each(dependencyList.layout,function(index, script) {
    //     onLoadDependencies.push(
    //         $.ajax({
    //           url: script,
    //           dataType: "script",
    //           cache: false,
    //           success: function(){console.info(script)}
    //         })
    //     );
    // });

    // /*router util*/
    // $.when(onLoadDependencies)
    //     .done(function(first_call, second_call, third_call){
    //         //do something
    //         console.info('dep');
    //     })
    //     .fail(function(){
    //         //handle errors
    //         console.error('dep?');
    //     });


    console.info('script ready');
    /**
     * Riot controller
     * define custom routes
     */
    RiotCrudController.defaults({
        target: '#content'
    });

    RiotCrudController.addRoute('dashboard',
        {
            title: 'Dashboard',
            menu: true,
            route: '/dashboard',
            dependencies: [riotCrudTheme + '/dashboard.js'],
            fn: function(id, action) {
                riot.mount('#content', 'dashboard');
            }
        }
    );

    RiotCrudController.addRoute('table-demo',{title: 'Table',menu: true, route: '/product/list'});
    RiotCrudController.addRoute('table-view',{title: 'Show',menu: true, route:'/product/view'});
    RiotCrudController.addRoute('table-edit',{title: 'Edit',menu: true, route:'/product/edit'});
    RiotCrudController.addRoute('table-create',{title: 'Create',menu: true, route:'/product/create'});

    /**
     * Riot crud model
     * define your models
     */
    RiotCrudModel.defaults({
        baseUrl: 'http://localhost:3030',
        target: 'div#content',
        requestFn: function(collection, view, id, params) {},
        responseFn: function(collection, view, id, params, response) {}
    });

    RiotCrudModel.addModel('product',{
            title: 'Products',
            menu: true,
            schema: 'http://localhost:3030/schema/product.json', // string || object ?? || array [{list:'list-tag'}] ?? default
            target: 'div#content', // optional
            // endpoint: '/api/product',
            // dependencies: 'product-view-plugin.js',
        },{ // mixed object || array ['list','show','create','update','delete'] ???
            list: {
                // optional
                tag: 'crud-datatables', // default
                title: 'Product List',
                schema: 'http://localhost:3030/schema/product_faker.json', // string || object ?? || array [{list:'list-tag'}] ?? default
                target: 'div#content', // optional
                // endpoint: '/api/product/list',
                dependencies: [
                    riotCrudTheme + '/views/crud-datatables.js',
                    '/bower_components/datatables.net/js/jquery.dataTables.min.js',
                    '/bower_components/gentelella/vendors/datatables.net/js/jquery.dataTables.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-bs/js/dataTables.bootstrap.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-buttons/js/dataTables.buttons.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-buttons-bs/js/buttons.bootstrap.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-buttons/js/buttons.flash.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-buttons/js/buttons.html5.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-buttons/js/buttons.print.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-fixedheader/js/dataTables.fixedHeader.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-keytable/js/dataTables.keyTable.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-responsive/js/dataTables.responsive.min.js',
                    '/bower_components/gentelella/vendors/datatables.net-responsive-bs/js/responsive.bootstrap.js',
                    '/bower_components/gentelella/vendors/datatables.net-scroller/js/datatables.scroller.min.js',
                    '/bower_components/gentelella/vendors/jszip/dist/jszip.min.js',
                    '/bower_components/gentelella/vendors/pdfmake/build/pdfmake.min.js',
                    '/bower_components/gentelella/vendors/pdfmake/build/vfs_fonts.js',
                ] // string || array
            },
            view:{
                tag: 'crud-jsoneditor', // default
                title: 'Product Demo',
                schema: 'http://localhost:3030/schema/product_faker.json', // string || object ?? || array [{list:'list-tag'}] ?? default
                target: 'div#content', // optional
                // endpoint: '/api/product/view',
                dependencies: [
                    riotCrudTheme + '/views/crud-jsoneditor.js',
                    '/bower_components/json-editor/dist/jsoneditor.min.js'
                ] // string || array
            },
            create: {
                fn: function() {riot.route('/product/create')}
            },
            edit: {
                title: 'Edit Products',
                menu:true,
                fn: function() {riot.route('/product/edit')}
            }
        });

    // RiotCrudModel.addModel('category',{
    //     title: 'Category',
    //     schema: 'http://localhost:3030/schema/order.json', // string || object ?? || array [{list:'list-tag'}] ?? default
    //     target: 'div#content', // optional
    //     // endpoint: '/api/category',
    //     tag: 'category-view',
    //     // dependencies: 'category-view-plugin.js',
    //     }, {
    //         list: {
    //         },
    //         view:{

    //         }
    //     }
    // );



    // console.info('routes: RiotCrudController.getRoutes()',RiotCrudController.getRoutes());
    // mount menu here will ignore following addRoute
    riot.mount('side-menu','side-menu', {
        routes: RiotCrudController.getRoutes()
    });

    if(window.location.hash === "") {
       riot.route('dashboard');
    }

    RiotCrudController.start();

    // RiotCrudModel
    // RiotCrudRoute.start(RiotCrudModel.getRoutes())
    // RiotCrudObservebla

})

