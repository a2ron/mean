function resumenController($scope, filterFilter, apuntesFactory, categoriasApuntesFactory, categoriasApuntesMETA, apuntesMETA) {

    var vm = this;
    /**
     * Categorias
     * @type {json}
     */
    $scope.objs = {};


    /**
     * Callback when "apuntes" are loaded, to calculate summaries
     */
    function apuntesAndCategoriesLoaded() {

        apuntesLoaded($scope, filterFilter);

        $scope.data = [];
        /**
         * apuntesGrouped = apuntes splited in two groups: income and expenses
         */
        var apuntesGrouped = d3.nest()
            .key(function (d) {
                return d.importe >= 0 ? 0 : 1; //two keys = two groups (income and expenses)
            }).sortKeys(d3.ascending)
            .rollup(function (d) {
                return d;
            }).entries($scope.apuntes);
        //group by date (monthly/dayly)
        var maxApunteValue = 0;
        //detect day mode
        var dayMode = vm.ini.getMonth() == vm.fin.getMonth() ? true : false;
        for (var i in apuntesGrouped) {
            apuntesGrouped[i].values = d3.nest()
                //assign keys to the apuntes:date (day or month according o dayMode)
                .key(function (d) {
                    var d = new Date(d.datetime ? d.datetime : d.createdOn);
                    var day = dayMode ? d.getDate() : 1;
                    return new Date(d.getFullYear(), d.getMonth(), day, 0, 0, 0);
                })
                //sort by date
                .sortKeys(function (a, b) {
                    a = new Date(a);
                    b = new Date(b);
                    return a.getTime() - b.getTime();
                })
                //aggregate (abs sum) by key (date)
                .rollup(function (d) {
                    return d3.sum(d, function (g) {
                        return g.importe >= 0 ? g.importe : -g.importe;
                    });
                }).entries(apuntesGrouped[i].values);
            //post-processing for chart
            var acu = 0;
            for (var j in apuntesGrouped[i].values) {
                apuntesGrouped[i].values[j].x = new Date(apuntesGrouped[i].values[j].key);
                //y value
                var y = apuntesGrouped[i].values[j].values;
                //dayly mode
                if (dayMode) y += acu;
                apuntesGrouped[i].values[j].y = y;
                acu = y;//update acu
                //update max
                if (y > maxApunteValue) maxApunteValue = y;
            }
            //filter invalid dates (corrupted)
            apuntesGrouped[i].values = filterFilter(apuntesGrouped[i].values, function (v) {
                return v.x.getTime() > 0;
            });
        }

        //line for INCOME
        $scope.data.push({
            key: _('Income'),
            type: 'line',
            yAxis: 1
            , values: apuntesGrouped[0].values
            , area: true
        });
        //line for OUTCOME
        $scope.data.push({
            key: _('Expenses'),
            type: 'line',
            yAxis: 1
            , values: apuntesGrouped[1].values
            , area: true
        });

        /*
         Adjust y domain
         */
        var chart = $scope.options.chart;
        chart.yDomain1 = [0, maxApunteValue];

        //update (with options modified)
        $scope.api.updateWithOptions($scope.options);

    }

    /**
     * To control counters visibility
     * @type {boolean}
     */
    $scope.verContadores = false;
    $scope.toggleContadores = function () {
        $scope.verContadores = !$scope.verContadores;
    };

    /**
     * To load info
     */
    $scope.find = function () {
        $scope.objs = categoriasApuntesFactory.query({}, function () {
            $scope.summary = apuntesFactory.summary();
            $scope.apuntes = apuntesFactory.filter({
                idCategoriaApunte: 0,
                yearIni: vm.ini.getFullYear(),
                monthIni: vm.ini.getMonth() + 1,
                dayIni: vm.ini.getDate(),
                yearFin: vm.fin.getFullYear(),
                monthFin: vm.fin.getMonth() + 1,
                dayFin: vm.fin.getDate()

            }, apuntesAndCategoriesLoaded);
            $scope.apuntesFilter = [];
        });
    };

    /**
     * Apuntes Table structure and data
     * @type {string}
     */
    var cellFilter = 'number:2';
    var cellClass = 'cellNumber';
    $scope.gridOptionsApuntes = {
        data: 'apuntesFilter',
        columnDefs: [
            {field: 'tituloCategoriaApunte', displayName: 'Categoría'},
            {field: 'titulo', displayName: 'Título', cellLinkPath: apuntesMETA.path},
            {field: 'importe', displayName: 'Importe', cellFilter: cellFilter, cellClass: cellClass}
        ],
        showGroupPanel: true,
        plugins: [
            new ngGridFlexibleHeightPlugin()
        ],
        i18n: 'es',
        rowTemplate: 'views/ng-grid-row.template.html'
    };

    /**
     * Date pickers
     */
    vm.fin = new Date();
    vm.ini = new Date(vm.fin.getFullYear(), vm.fin.getMonth(), 1);
    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
    };

    vm.allIn = function () {
        vm.fin = new Date();
        vm.fin = new Date(vm.fin.getFullYear() + 1, 0, 1);
        vm.ini = new Date(vm.fin.getFullYear() - 100, 0, 1);
        $scope.find();
    };

    $scope.open = function ($event, openedVarName) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope[openedVarName] = !$scope[openedVarName];
    };

    /**
     * Categories Table structure and data
     * @type {string}
     */
    $scope.gridOptionsCategorias = {
        init: 'find()',
        data: 'objs',
        columnDefs: [
            {
                field: 'operation', displayName: '+ / -', width: '40',
                cellTemplate: '<div class="ng-grid-cell-button">' +
                '<button class="ng-grid-cell-checkbox" ng-click="changeOperation(row.entity)">' +
                '<span ng-if="row.entity.operation==\'+\'">+</span>' +
                '<span ng-if="row.entity.operation==\'-\'">-</span>' +
                '<span ng-if="!row.entity.operation"></span>' +
                '</button>' +
                '</div>',
                ngGridSummaryPlugin: 'operationColumn'
            },
            {field: 'titulo', displayName: _('Category'), cellLinkPath: categoriasApuntesMETA.path},
            {
                displayName: _('Income'),
                field: 'income',
                cellFilter: cellFilter,
                cellClass: cellClass,
                ngGridSummaryPlugin: true
            },
            {
                displayName: _('Expenses'),
                field: 'expense',
                cellFilter: cellFilter,
                cellClass: cellClass,
                ngGridSummaryPlugin: true
            },
            {
                displayName: _('Balance'),
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
        //Callback for when you want to validate something after selection.
        afterSelectionChange: function (row) {
            $scope.apuntesFilter = filterFilter($scope.apuntesFilter, {idCategoriaApunte: {_id: "!" + row.entity._id}});

            if (row.selected) {
                var showns = filterFilter($scope.apuntes, {idCategoriaApunte: row.entity._id});
                angular.forEach(showns, function (value, key) {
                    var ap = showns[key];
                    ap.tituloCategoriaApunte = row.entity.titulo;
                    $scope.apuntesFilter.push(ap);
                });
            }
            $(window).resize();//for ng-show ng-grid bug
        },
        i18n: 'es',
        multiSelect: false,
        footerTemplate: 'views/ng-grid-footer.template.html',
        rowTemplate: 'views/ng-grid-row.template.html'
    };

    /**
     * To change the operation for the aggregation in the ngGridSummaryPlugin
     * @param entity
     */
    $scope.changeOperation = function (entity) {
        if (entity.operation && entity.operation == '+')
            entity.operation = '-';
        else if (entity.operation && entity.operation == '-')
            entity.operation = false;
        else entity.operation = '+';
    };

    /** *******************************************************************************************************/
    /** CHARTS **/
    /** ********************************************************************************************************/
    $scope.options = {
        chart: {
            type: 'multiChart',
            height: 450,
            margin: {
                top: 30,
                right: 60,
                bottom: 50,
                left: 70
            },
            color: d3.scale.category10().range(),
            //useInteractiveGuideline: true,
            transitionDuration: 500,
            xAxis: {
                tickFormat: function (d) {
                    return d3.time.format('%d-%m-%y')(new Date(d));
                }
                //, showMaxMin: false//if it's not defined to false, the last tick isn't visible
            },
            yAxis1: {
                tickFormat: function (d) {
                    return d3.format(',.1f')(d);
                }
            }
        }
    };

}


/**********************************************************************************************************/

angular.module('resumen', [])
    .config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider.
                when('/', {
                    templateUrl: 'views/resumen.client.view.html',
                    controller: 'resumenController',
                    controllerAs: "vm"
                });
        }
    ])
    .controller('resumenController', resumenController);