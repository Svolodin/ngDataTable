// объявление модуля для календарика
var myDPModule = angular.module('mydatepickermodule', []);
myDPModule.directive('mydatepicker',
    function () {
        return {
            scope : {
                currDate: "=ngModel"
                //,funcCall: "&onChangeDate"
            },
            link: function (scope, element, attributes) {
                $(element).datepicker({
		    weekStart:1,
                    format: 'yyyy-mm-dd'
                }).on('changeDate', function (ev) {
                    scope.$apply(scope.currDate = $(element).val());
                    //scope.funcCall();
                    $(element).datepicker('hide');
                });
            },
            restrict: "EACM"
        }
    });
// DataTable
var myDTModule = angular.module('mydatatablemodule', ['mydatepickermodule','ngAnimate','ui.bootstrap']);
myDTModule.directive('mydatatable',
    function ($location, $http, $rootScope, $compile) {
        return {
            scope : {
                currRow: "=ngModel",
                funcCall: "&onChangeRow"
            },
            link: function (scope, element, attributes) {

                //init Attrinbutes
                scope.table_name = attributes['tableName'];
                scope.main_table_name = attributes['mainTableName'];
                scope.id_name = attributes['idName'];
                scope.main_id_name = attributes['mainIdName'];
                scope.condition=attributes['condition'];
                scope.condition_filtered='';
	        scope.show_load = false;

                if (angular.isDefined(attributes['fieldLook']) && attributes['fieldLook']!="")
                     scope.field_look = angular.fromJson(attributes['fieldLook']);
                else
                    scope.field_look = {};
                if (angular.isDefined(attributes['fieldHide']) && attributes['fieldHide']!="")
                     scope.field_hide = angular.fromJson(attributes['fieldHide']);
                else
                    scope.field_hide = {};
                if (angular.isDefined(attributes['fieldTitle']) && attributes['fieldTitle']!="")
                    scope.field_title =  angular.fromJson(attributes['fieldTitle']);
                else
                    scope.field_title = {};
                if (angular.isDefined(attributes['configTable']) && attributes['configTable']!="")
                     scope.config_table = angular.fromJson(attributes['configTable']);
                else
                    scope.config_table = {};
                if (angular.isDefined(attributes['decoreConfig']) && attributes['decoreConfig']!="")
                     scope.decore_config = angular.fromJson(attributes['decoreConfig']);
                else
                    scope.decore_config = {};
                if (angular.isDefined(attributes['defaultValues']) && attributes['defaultValues']!="")
                    scope.default_values =  angular.fromJson(attributes['defaultValues']);
                else
                    scope.default_values = {};
                if (angular.isDefined(attributes['buttons']) && attributes['buttons']!="")
                    scope.buttons =  angular.fromJson(attributes['buttons']);
                else
                    scope.buttons = {};

		if (scope.config_table.init_cond) scope.condition_filtered=scope.config_table.init_cond;

		console.log(scope.config_table.readonly);

                scope.slData = [];
                scope.add_data = {};
                scope.curr_id = 0;
                scope.main_curr_id = 0;
                scope.searchText = '';
                scope.alimits = [5,10,50,100,1000];
		if (scope.config_table.limit)
			scope.limit = scope.config_table.limit;
		else
	                scope.limit = 100;
                scope.currPage = 1;
                scope.total_count = 0;
                scope.maxSize = 5;
                scope.order_field = '';
                scope.order_type = 'desc';
		scope.uri = '';
		
                scope.init_data = function(condition,src) {
                    scope.show_load=true;
                    if (!condition)
                        condition=''
                    else
                        condition=scope.main_id_name+'='+scope.main_curr_id;

     		    scope.uri = siteUrl+ '/ko/store/'+scope.table_name+'/'+scope.id_name+'?limit='+scope.limit+'&page='+scope.page+'&condition[]='+condition+'&condition[]='+encodeURI(scope.condition_filtered)+'&searchText='+scope.searchText+'&order='+scope.order_field+'&order_type='+scope.order_type+'&src='+src;	

		    if (src=='xls') {
	                scope.show_load=false;
			window.location.href=scope.uri;	
		    }	
		    if (src=='disp') 
	                    $http.get(scope.uri).success(function (data) {
	                        scope.data_set = data.data_set;
	                        scope.field_list = data.field_list;
	                        scope.field_types = data.field_types;
	                        scope.total_count = data.count;
	                        scope.result = data.result;
		                scope.show_load=false;
	                    });


		   //console.log(scope.buttons);

                };

                scope.pageChanged = function() {
                    scope.page = scope.currPage-1;
                    scope.init_data(scope.condition,'disp');
                };

                scope.setOrderField = function(key) {
                    scope.order_field = key;
	            scope.order_type = (scope.order_type=='desc')?'asc':'desc';
                    scope.init_data(scope.condition,'disp');
                };

                scope.init_slData = function(){
                    angular.forEach(scope.field_look, function(key,value){
                        $http.get(siteUrl+ '/ko/store/'+key+'/id').success(function (data) {
                            scope.slData[value] = data.data_set;
                            scope.result = data.result;
                        });
                    });
                };

                scope.getSlDataNameById = function(arrSelect, sId) {
                    var i = 0;
                    if (angular.isArray(arrSelect)) {
                        while (i < arrSelect.length) {
                            if (String(arrSelect[i].id) == String(sId)) {
                                return arrSelect[i].name;
                            };
                            i++;
                        }
                    }
                    return '';
                };

                //  Обработка собятия для дочерней таблица
                if (scope.main_table_name){
                    $rootScope.$on('be_select_'+scope.main_table_name,function(event,data){
                        console.log('EVENT activate');
                        console.log(data);
                        scope.main_curr_id = data.id;
                        scope.init_data(scope.condition,'disp');
                    });
                }

                //  Обработка собятия фильтра
                $rootScope.$on('on_filtred',function(event,data){
                        console.log('EVENT filter');
                        console.log(data);
			scope.condition_filtered=data;
                        scope.init_data(scope.condition,'disp');
                });

                //  Обработка собятия фильтра для конкретной таблицы
                $rootScope.$on('on_filtred_'+scope.table_name,function(event,data){
                        console.log('EVENT filter');
                        console.log(data);
			scope.condition_filtered=data;
                        scope.init_data(scope.condition,'disp');
                });


                //  Обработка собятия перезагрузки данных
                $rootScope.$on('on_reload',function(event,data){
                        scope.init_data(scope.condition,'disp');
                });

                // Выбор значения в главной таблице
                //if (!scope.main_table_name){
                scope.selectRow = function(row,event,event_name){
                        console.log('event ['+event_name+'] ');
                        //var data = row;
                        scope.curr_id = row.id;
                        scope.currRow = row.id;
                        $rootScope.$broadcast(event_name+'_'+scope.table_name,row);
			scope.funcCall();

                 }
                // }

                //Action Редактирование записи
                scope.EditRow = function(row) {
                    //console.log(row);
                    scope.curr_id = row.id;
                    $http.get(siteUrl+ '/ko/storeRow/'+scope.table_name+'/'+scope.id_name+'/'+row.id).success(function(data) {
                        scope.edit_data = data;
                    });
                    $('#EditModal'+scope.table_name).modal('show');
                };


                scope.SaveEditRow = function(edit_data) {
                    scope.save_data=angular.copy(edit_data);
                    console.log(edit_data);
                    console.log(scope.save_data);
                    $http.post(siteUrl+'/ng/api/'+scope.table_name+'/'+scope.id_name+'/save_edit/123',scope.save_data).success(function(data){
                        scope.init_data(scope.condition,'disp');
                    })
                    $('#EditModal'+scope.table_name).modal('hide');
                }

                scope.SaveAddRow = function(add_data) {
                    //add_data.<?=$parent_id?> = $rootScope.currId;
                    scope.save_data=angular.copy(add_data);
                    console.log(add_data);
                    console.log(scope.save_data);
                    $http.post(siteUrl+ '/ng/api/'+scope.table_name+'/'+scope.id_name+'/save_add/123',scope.save_data).success(function(data){
                        scope.init_data(scope.condition,'disp');
                    })
                    $('#AddModal'+scope.table_name).modal('hide');
                }

                //Action Удаление записи
                scope.DelRow = function(row_id) {
                    if (confirm('Вы действительно хотите удалить запись с id '+row_id))
                    {
                        $http.post(siteUrl+ '/ng/api/'+scope.table_name+'/'+scope.id_name+'/save_del/123',row_id).success(function(data){
                        scope.init_data(scope.condition,'disp');
                    })
                    }
                }

		scope.getDecoreClass = function(val) {
		        if (scope.decore_config)
				return scope.decore_config[val];
			return '';
		}

		scope.getExcel = function(){
	                scope.init_data(scope.condition,'xls');
		}

                scope.init_data(scope.condition,'disp');
                scope.init_slData();


            },
            templateUrl: baseUrl+'media/ng-datatable/mytemplate.html',
            restrict: "EACM"
        }
    });

