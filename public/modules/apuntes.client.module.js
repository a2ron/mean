function apuntesController($scope, $routeParams, $location, categoriasApuntesFactory, apuntesFactory, apuntesMETA, filterFilter)
{

    var cellFilter = 'number:2';
    var cellClass = 'cellNumber';

    controllerBase($scope, $routeParams, $location, apuntesFactory, apuntesMETA);


    $scope.fin = new Date();
    $scope.ini = new Date($scope.fin.getFullYear(), $scope.fin.getMonth(), 1);
    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
    };
    $scope.open = function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.opened = true;
    };
    var categorias4SelectForm = [];
    function defSchema()
    {
        //definir el schema del form ahora que tengo las categorias
        $scope.schema = {
            type: "object",
            properties: {
                titulo: {
                    type: "string",
                    minLength: 2,
                    title: "Título",
                    required: true
                },
                descripcion: {
                    type: "string",
                    title: "Descripción"
                },
                importe: {
                    title: "Importe",
                    type: 'number',
                    required: true
                },
                idCategoriaApunte: {
                    title: "Categoría",
                    type: 'string'
                },
                datetime: {
                    title: 'Fecha',
                    "type": "string",
                    "format": "date"
                }
            }
        };
        $scope.form = [
            'titulo',
            'descripcion',
            'importe',
            {
                key: "idCategoriaApunte",
                type: 'select',
                titleMap: categorias4SelectForm
            },
            {
                "key": "datetime"
            },
            $scope.actionButtons
        ];

        $scope.$apply();//for update interface
    }

    /* load categorias to asign to apuntes */
    $scope.categorias = categoriasApuntesFactory.query();
    $scope.$watchCollection('categorias', function()
    {
        if ($scope.categorias.length > 0)
            setTimeout(_loadCategorias);//timeout for prevent error $digest 
        function _loadCategorias()
        {
            categorias4SelectForm = [];
            categorias4SelectForm.push({
                name: 'Seleccione una',
                value: 0
            });
            for (var i in $scope.categorias)
            {
                var cat = $scope.categorias[i];
                if (cat.titulo) {
                    categorias4SelectForm.push({
                        name: cat.titulo,
                        value: cat._id
                    });
                }
            }
            defSchema();
        }
    });

    $scope.initViewEditOrCreate = function()
    {
        if ($scope.viewEditOrCreate === 'Editar') {
            $scope.findOne();
            $scope.action = $scope.update;
        }
        else {
            $scope.action = $scope.create;
            $scope.obj = new apuntesFactory({
                idCategoriaApunte: 0
            });
        }
    };

    $scope.find = function()
    {
        $scope.objs = apuntesFactory.query(function(res)
        {
            //preparing for angular-schema-form
            angular.forEach(res, function(value, key) {
                res[key].categoriaTitulo = res[key].idCategoriaApunte.titulo;
            });
        });
    };

    /**********************************************************************************************************/

    $scope.gridOptions = {
        data: 'objs',
        columnDefs: [
            {
                displayName: 'Categoría',
                field: 'categoriaTitulo'
            },
            {
                displayName: 'Título',
                field: 'titulo',
                cellLinkPath: apuntesMETA.path
            },
            {
                displayName: 'Descripción',
                field: 'descripcion'
            },
            {
                displayName: 'Importe',
                field: 'importe',
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
        rowTemplate: 'views/ng-grid-row.template.html',
        showGroupPanel: true
    };

}
var params = {
    nameModule: 'apuntes',
    path: 'apuntes',
    id: 'apunteId',
    pathAPI: 'api/apuntes/:apunteId',
    viewParams: {
        name: 'Apuntes',
        nameSingular: 'Apunte',
        listFields: [
            {
                title: 'Título',
                key: 'titulo'
            },
            {
                title: 'Descripción',
                key: 'descripcion'
            },
            {
                title: 'Importe',
                key: 'importe'
            },
            {
                title: 'Categoría',
                key: 'categoriaTitulo'
            }
        ],
        path: 'apuntes'//redundante pero necesario
    },
    injection: apuntesController,
    moreActionsREST: {
        filter: {
            url: 'api/apuntes/filter/:idCategoriaApunte/:yearIni/:monthIni/:dayIni/:yearFin/:monthFin/:dayFin',
            method: 'GET',
            isArray: true
        },
        summary: {
            url: 'api/apuntes/info/summary',
            method: 'GET',
            isArray: false
        }
    }
};

moduleCrudBase(params)
        /* routes */
        .config(['$routeProvider', params.nameModule + 'METAProvider',
            function($routeProvider, META) {
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
                            templateUrl: 'views/edit.client.view.html',
                            controller: META.params.nameModule + 'Controller',
                        }).
                        when('/' + META.params.path + '/:' + META.params.id + '/edit', {
                            templateUrl: 'views/edit.client.view.html',
                            controller: META.params.nameModule + 'Controller'
                        });
            }
        ]);