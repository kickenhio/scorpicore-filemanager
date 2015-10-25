(function(){
	angular
		.module('AngularExample', ['angularFileUpload'])
		
		.controller('exampleController', ['$scope', '$rootScope', '$http', 'FileUploader', function($scope, $rootScope, $http, FileUploader) {
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
		
		$http.get("/admin/fileupload/load").then(function(response) {
			$scope.list = response.data.files;
			$scope.directories = response.data.directories;
		});
		
		$scope.dirClick = function(item)
		{
			if(item.active == 'active'){
			$http.get("/admin/fileupload/load",{
				params: {
						location: item.location
				}
			}).then(function(response) {
				$scope.list = response.data.files;
				$scope.directories = response.data.directories;
			});
			}
			else
			{
				angular.forEach($scope.directories, function(value) {
				  value.active = false;
				});
				
				item.active = 'active';
			}
		};
		
		$scope.deleteFolder = function(){
			vex.dialog.confirm({
			  message: 'Czy napewno usunac?',
			  callback: function(value) {
				if(value){
					var aktywna = null;
					angular.forEach($scope.directories, function(value) {
						if(value.active == 'active') {
						  aktywna = value;
					  }
					});
					
					$http.post("/admin/fileupload/deletedirectory", { name: aktywna.location }).then(function(response) {
						$scope.directories.splice($scope.directories.indexOf(aktywna), 1);
					});
				}
		  	}});
		}
		
		$scope.newFolder = function(){
			vex.dialog.open({
			  message: 'Nazwa folderu:',
			  input: "<input name=\"folder_name\" type=\"text\" required />",
			  buttons: [
				$.extend({}, vex.dialog.buttons.YES, {
				  text: 'Dodaj'
				}), $.extend({}, vex.dialog.buttons.NO, {
				  text: 'Cancel'
				})
			  ],
			  callback: function(data) {
				if (data === false) {
					
				}
				else if(false && data.folder_name !== newpass)
				{
					vex.dialog.alert('Rozne hasla!');
				}
				else {
					$http.post("/admin/fileupload/newdirectory", { folder_name: data.folder_name }).then(function(response) {
						$scope.directories.push({
							name: data.folder_name,
							location: response.data.location,
							active: 'false'
						});
					});
				}
			  }
			});
		}
		
		$scope.select = function(obj)
		{
				if(ckeditor_func != null)
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
				if($scope.thumbs != null)
				{
					$scope.getThumbs(obj);
						}
						else
						{
					window.opener.FilePicker.getFromManager(filepickerID, '/'+obj.src);
							window.close();
						}
			}
		};
		
		
		
		$scope.getThumbs = function(obj)
		{
			var wybrany = null;
			angular.forEach($scope.thumbs, function(value, key) {
				if(wybrany == null && value.chosen == false) {
					wybrany = $scope.thumbs[key];
				}
			});
			
			if(wybrany == null)
				{
					window.opener.FilePicker.getFromManager(filepickerID, '/'+obj.src);
				window.opener.FilePicker.getThumbsFromManager(filepickerID, JSON.stringify($scope.thumbs));
				window.close();
			}
			
			vex.dialog.open({
				message: 'Wybierz zaznaczenie dla '+wybrany.default,
				input: "<img style=\"max-width:100%;\" src=\"/"+obj.src+"\" id=\"cropper\" alt=\"\">",
				buttons: [
					$.extend({}, vex.dialog.buttons.YES, {
					  text: 'Wybierz'
					}), $.extend({}, vex.dialog.buttons.NO, {
					  text: 'Nie wybieraj'
					})
				],
				className: 'vex-theme-default wybierz-zaznaczenie',
				afterOpen: function() {
					$('#cropper').cropper({
					  aspectRatio: wybrany.ratio,
					  autoCropArea: 0.65,
					  strict: true,
					  guides: false,
					  highlight: true,
					  dragCrop: true,
					  zoomable: false,
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
		
		/* usun */
		$scope.delete = function(obj) {
			vex.dialog.confirm({
			  message: 'Czy napewno usunac?',
			  callback: function(value) {
				if(value){
					$http.post("/admin/fileupload/delete", { name: obj.src }).then(function(response) {
						$scope.list.splice($scope.list.indexOf(obj), 1);
					});
				}
		  	}});
		};
	}]);
})();