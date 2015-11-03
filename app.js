(function(){
	angular
		.module('AngularExample', ['angularFileUpload', 'ng-context-menu'])
		.controller('exampleController', ['$scope', '$rootScope', '$http', 'FileUploader', function($scope, $rootScope, $http, FileUploader)
		{
			$scope.crop = false;
			$scope.thumbs = (function(sizes)
			{
				if(sizes != 'null')
				{
				var temp = {};
				angular.forEach(sizes, function(value, key) {
					var arr = value.split('x');
					var ratio = parseInt(arr[0]) / parseInt(arr[1])
					temp[key] = {
						'name' : key,
						'default' : value,
						'width' : arr[0],
						'height' : arr[1],
						'ratio' : ratio,
						'chosen' : false
					}
				});
				return temp;
				}
				return null;
				
			})(thumbs);
			
			vex.defaultOptions.className = 'vex-theme-default';
			
			var csrf_token = document.querySelector('input[name="_token"]').getAttribute('value');
			$scope.uploader = new FileUploader({
				headers : {
					'X-CSRF-TOKEN': csrf_token
				},
				url: '/admin/fileupload/upload'
			});
			
			$scope.uploader.filters.push({
				name: 'customFilter',
				fn: function(item, options) {
					return this.queue.length < 10;
				}
			});
			
			$scope.uploader.onBeforeUploadItem = function(item) {
				$scope.list.push({
					name: item.file.name,
					thumb: 'loading'
				});
			};
			
			$scope.uploader.onProgressItem = function(fileItem, progress) {
				var index = $scope.list.map(function(e) { return e.name; }).indexOf(fileItem.file.name);
				$scope.list[index]['percent'] = progress;
			};
			
			$scope.uploader.onSuccessItem = function(fileItem, response, status, headers) {
				fileItem.remove();
				var index = $scope.list.map(function(e) { return e.name; }).indexOf(fileItem.file.name);
				$scope.list[index] = response;
			};
			
			$scope.controller = {
				isImage: function(item) {
					var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
					return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
				}
			};
			
			$scope.refresh = function()
			{
				$http.get("/admin/fileupload/load").then(function(response) {
					$scope.list = response.data.files;
					$scope.directories = response.data.directories;
					$scope.breadcrumbs = response.data.breadcrumbs;
				});
			};
			
			$scope.refresh();
			
			$scope.dirClick = function(item)
			{
				if (item.selected == 'active' || item.type == 'breadcrumb')
				{
					$http.get("/admin/fileupload/load",{
						params: {
							"location[]": item.path
						}
					}).then(function(response) {
						$scope.list = response.data.files;
						$scope.linkback = response.data.linkback;
						$scope.directories = response.data.directories;
						$scope.breadcrumbs = response.data.breadcrumbs;
					});
				}
				else
				{
					angular.forEach($scope.directories, function(value) {
						value.selected = false;
					});
					
					item.selected = 'active';
				}
			};
			
			$scope.copycut = function(obj, method) {
				$http.post("/admin/fileupload/copycut",
				{ obj: obj, method: method})
				.then(function(response) {
					$.amaran({
						'message': (method == 'copy') ? Lang.message.copied : Lang.message.cuted
					});
				});
			};
			
			$scope.paste = function() {
				$http.post("/admin/fileupload/paste")
				.then(function(response) {
					$scope.refresh();
					$.amaran({
						'message': Lang.message.pasted
					});
				});
			};
			
			$scope.rename = function(obj) {
				var postfix = '';
				if (obj.type == 'file') {
						postfix = "<div class=\"small-1 columns\">" +
									  "<span class=\"postfix\">."+obj.extension+"</span>" +
									"</div>" +
								  "</div>"
				}
				vex.dialog.open({
				  message: Lang.dialogs.rename_file,
				  input: "<div class=\"row collapse postfix-radius\">"+
							"<div class=\"small-11 columns\">" +
							  "<input name=\"new_name\" type=\"text\" value=\""+obj.name+"\" required />" +
							  "<input name=\"old_name\" type=\"hidden\" value=\""+obj.name+"\" />" +
							"</div>" + postfix,
				  buttons: [
					$.extend({}, vex.dialog.buttons.YES, {
					  text: Lang.dialogs.rename_directory_yes
					}), $.extend({}, vex.dialog.buttons.NO, {
					  text: Lang.dialogs.rename_directory_no
					})
				  ],
				  callback: function(data) {
					if (data === false) {
						$.amaran({
							'message': Lang.message.rename_file_cancelled
						});
					} else {
						$http.post("/admin/fileupload/rename",
						{ obj: obj, old_name: data.old_name, new_name: data.new_name })
						.then(function(response) {
							obj.name = response.data.name;
						});
					}
				  }
				});
			}
			
			$scope.newFolder = function() {
				vex.dialog.open({
				  message: Lang.dialogs.new_directory,
				  input: "<input name=\"folder_name\" type=\"text\" required />",
				  buttons: [
					$.extend({}, vex.dialog.buttons.YES, {
					  text: Lang.dialogs.new_directory_yes
					}), $.extend({}, vex.dialog.buttons.NO, {
					  text: Lang.dialogs.new_directory_no
					})
				  ],
				  callback: function(data) {
					if (data === false) {
						$.amaran({
							'message': Lang.message.cancelled
						});
					}
					else
					{
						$http.post("/admin/fileupload/newdirectory", { folder_name: data.folder_name }).then(function(response) {
							$scope.directories.push(response.data);
						});
					}
				  }
				});
			}

			$scope.select = function(obj) {
				if (ckeditor_func != null)
				{
					window.parent.opener.CKEDITOR.tools.callFunction(ckeditor_func, '/'+obj.src, function()
					{
						//var element,
						//dialog = this.getDialog();
						//element = dialog.getContentElement( 'tab-basic', 'padding' );
						//element.setValue( obj.resolution[1] / obj.resolution[0] );
					});
				}
				else
				{
					if ($scope.thumbs != null)
					{
						$scope.getThumbs(obj);
					}
					else
					{
						window.opener.FilePicker.getFromManager(filepickerID, '/'+obj.src);
						window.close();
					}
				}
			}
			
			$scope.getThumbs = function(obj) {
				var wybrany = null;
				angular.forEach($scope.thumbs, function(value, key) {
					if (wybrany == null && value.chosen == false) {
						wybrany = $scope.thumbs[key];
					}
				});

				if (wybrany == null) {
					window.opener.FilePicker.getFromManager(filepickerID, '/'+obj.fullpath);
					window.opener.FilePicker.getThumbsFromManager(filepickerID, JSON.stringify($scope.thumbs));
					window.close();
				}

				vex.dialog.open({
					message: 'Wybierz zaznaczenie dla '+wybrany.default,
					input: "<img style=\"max-width:100%;\" src=\"/"+obj.fullpath+"\" id=\"cropper\" alt=\"\">",
					buttons: [
						$.extend({}, vex.dialog.buttons.YES, {
						  text: 'Wybierz'
						}), $.extend({}, vex.dialog.buttons.NO, {
						  text: 'Nie wybieraj'
						})
					],
					className: 'vex-theme-scorpicore',
					afterOpen: function() {
						$('#cropper').cropper({
						  aspectRatio: wybrany.ratio,
						  autoCropArea: 0.65,
						  strict: true,
						  guides: false,
						  highlight: true,
						  dragCrop: true,
						  zoomable: true,
						  crop: function(e) {
							console.log(e.x);
							console.log(e.y);
							console.log(e.width);
							console.log(e.height);
							console.log(e.rotate);
							console.log(e.scaleX);
							console.log(e.scaleY);
						  }
						});
					},
					afterClose: function() {
						$('#cropper').cropper('destroy');
						$scope.getThumbs(obj);
					},
					callback: function(data) {
						if (data === false) {
							$.amaran({
								'message':'Cancelled.'
							});
							$scope.thumbs[wybrany['name']]['chosen'] = 'empty';
						}
						else {
							$scope.thumbs[wybrany['name']]['chosen'] = $('#cropper').cropper('getData',true);
						}
					  }
				});
			}
			
			$scope.modify = function(obj) {
				
				caman = function(obj, alter){
					$("#caman").removeAttr("data-caman-id");
					Caman("#caman", '/'+obj.fullpath, function () {
						
						if ($('input[data-filter=clip]').val() != 0) {
						this.brightness($('input[data-filter=brightness]').val()); }
						
						if ($('input[data-filter=clip]').val() != 0) {
						this.clip($('input[data-filter=clip]').val()); }
						
						this.sharpen($('input[data-filter=sharpen]').val());
						
						if (alter){
							this.render(function () {
								var image = this.toBase64();
								$http.post("/admin/fileupload/modifyimage", { source: obj.fullpath, alter_image: image }).then(function(response) {
									$.amaran({
										'message':'Zmodyfikowano.'
									});
								});
						  });
						} else {
							this.render();
						}
					});
				};
				
				vex.dialog.open({
					message: 'Wybierz zaznaczenie dla '+obj.name,
					input: "<div class=\"row\">"+
								"<div class=\"small-7 columns\" style=\"border:1px solid black;\">"+
									"<canvas id=\"caman\" style=\"max-height:100%;max-width:100%;\"></canvas>"+
								"</div>"+
								"<div class=\"small-5 columns\">"+
									"<div class=\"row\">"+
										"<div class=\"small-12 columns\">"+
											"<input type=\"range\" min=\"-100\" max=\"100\" step=\"1\" value=\"0\" data-filter=\"brightness\">"+
										"</div>"+
										"<div class=\"small-12 columns\">"+
											"<input type=\"range\" min=\"0\" max=\"100\" step=\"1\" value=\"0\" data-filter=\"clip\">"+
										"</div>"+
										"<div class=\"small-12 columns\">"+
											"<input type=\"range\" min=\"0\" max=\"100\" step=\"1\" value=\"0\" data-filter=\"sharpen\">"+
										"</div>"+
									"</div>"+
								"</div>"+
							"</div>",
					buttons: [
						$.extend({}, vex.dialog.buttons.YES, {
						  text: 'Wybierz'
						}), $.extend({}, vex.dialog.buttons.NO, {
						  text: 'Nie wybieraj'
						})
					],
					className: 'vex-theme-scorpicore',
					afterOpen: function() {
						caman(obj);
						$('input[data-filter]').change(function(){
							caman(obj);
						});
					},
					afterClose: function() {
						// nothing?
					},
					callback: function(data) {
						if (data === false) {
							$.amaran({
								'message': Lang.message.cancelled
							});
						}
						else
						{
							caman(obj,true);
						}
					  }
				});
			}
			
			$scope.delete = function(obj) {
				vex.dialog.confirm({
				  message: 'Czy napewno usunac?',
				  callback: function(value) {
					if(value){
						$http.post("/admin/fileupload/delete", { obj: obj }).then(function(response) {
							if (obj.type == 'file')
							{
								$scope.list.splice($scope.list.indexOf(obj), 1);
							}
							else
							{
								$scope.directories.splice($scope.directories.indexOf(obj), 1);
							}
						});
					}
				}});
			};
	}]);
})();