function categoriasController($scope, $routeParams, $location, categoriasApuntesFactory, filterFilter, apuntesFactory, categoriasApuntesMETA, apuntesMETA) {
    var parent = controllerBase($scope, $routeParams, $location, categoriasApuntesFactory, categoriasApuntesMETA);

    $scope.apuntes = [];
    $scope.findApuntes = function (onSuccess) {
        var filter = {
            idCategoriaApunte: ($scope.obj) ? $scope.obj._id : 0
        };

        $scope.apuntes = apuntesFactory.filter(filter, onSuccess);
        $scope.apuntesFilter = [];
    };


    var find = parent.find;
    $scope.find = function () {
        //parent::find
        find({
            onSuccess: function () {
                $scope.findApuntes(function()
                {
                    apuntesLoaded($scope,filterFilter);
                });
            }
        });
    };


    $scope.initViewEditOrCreate = function () {
        if ($scope.viewEditOrCreate === 'Editar') {
            $scope.findOne(function () {
                $scope.findApuntes();
            });
            $scope.action = $scope.update;
        }
        else {
            $scope.obj = new categoriasApuntesFactory({});
            $scope.action = $scope.create;
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////

    $scope.schema = {
        type: "object",
        properties: {
            titulo: {type: "string", minLength: 2, title: "Título", required: true},
            descripcion: {
                type: "string",
                title: "Descripción"
            }
        }
    };
    $scope.form = [
        '*',
        $scope.actionButtons
    ];

    var cellFilter = 'number:2';
    var cellClass = 'cellNumber';


    $scope.gridOptions = {
        data: 'objs',
        columnDefs: [
            {
                displayName: 'Título',
                field: 'titulo',
                cellLinkPath: categoriasApuntesMETA.path
            },
            {
                displayName: 'Descripción',
                field: 'descripcion'
            },
            {
                displayName: 'In',
                field: 'income',
                cellFilter: cellFilter,
                cellClass: cellClass,
                ngGridSummaryPlugin: true
            },
            {
                displayName: 'Out',
                field: 'expense',
                cellFilter: cellFilter,
                cellClass: cellClass,
                ngGridSummaryPlugin: true
            },
            {
                displayName: 'Total',
                field: 'sum',
                cellFilter: cellFilter,
                cellClass: cellClass,
                ngGridSummaryPlugin: true
            }
        ],
        showFooter: true,
        footerRowHeight: 30,
        plugins: [
            new ngGridFlexibleHeightPlugin(),
            new ngGridSummaryPlugin()
        ],
        i18n: 'es',
        multiSelect: false,
        footerTemplate: 'views/ng-grid-footer.template.html',
        rowTemplate: 'views/ng-grid-row.template.html'
    };

}


/**********************************************************************************************************/

var params = {
    nameModule: 'categoriasApuntes',
    path: 'categorias',
    id: 'categoriaApunteId',
    pathAPI: 'api/categorias/:categoriaApunteId',
    viewParams: {
        name: 'Categorías',
        nameSingular: 'Categoría',
        path: 'categorias'//redundante pero necesario
    },
    injection: categoriasController
};

moduleCrudBase(params)/* routes */
    .config(['$routeProvider', params.nameModule + 'METAProvider',
        function ($routeProvider, META) {
            $routeProvider.
                when('/' + META.params.path, {
                    templateUrl: 'views/list.client.view.html',
                    controller: META.params.nameModule + 'Controller'
                }).
                when('/' + META.params.path + '/crear', {
                    templateUrl: 'views/edit.client.view.html',
                    controller: META.params.nameModule + 'Controller'
                }).
                when('/' + META.params.path + '/:' + META.params.id, {
                    templateUrl: 'views/editCategoria.client.view.html',
                    controller: META.params.nameModule + 'Controller'
                }).
                when('/' + META.params.path + '/:' + META.params.id + '/edit', {
                    templateUrl: 'views/edit.client.view.html',
                    controller: META.params.nameModule + 'Controller'
                });
        }
    ]);