(function(){
	angular.module('AngularExample', ['angularFileUpload', 'ngJcrop'])
	
		.config(function(ngJcropConfigProvider){
			// [optional] To change the jcrop configuration
			// All jcrop settings are in: http://deepliquid.com/content/Jcrop_Manual.html#Setting_Options
			ngJcropConfigProvider.setJcropConfig({
				bgColor: 'black',
				bgOpacity: .4,
				aspectRatio: 0
			});
			
			// [optional] To change the css style in the preview image
			ngJcropConfigProvider.setPreviewStyle({
				'width': '100px',
				'height': '100px',
				'overflow': 'hidden',
				'margin-left': '5px'
			});
		})
		
		.controller('exampleController', ['$scope', '$rootScope', '$http', 'FileUploader', function($scope, $rootScope, $http, FileUploader) {
		
		$scope.thumbs = (function(sizes)
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
					'ratio' : ratio
				}
			});
			return temp;
		})
		(thumbs);
		
		vex.defaultOptions.className = 'vex-theme-default';
		var csrf_token = document.querySelector('input[name="_token"]').getAttribute('value');
		$scope.uploader = new FileUploader({
			headers : {
				'X-CSRF-TOKEN': csrf_token
			},
			url: '/admin/fileupload/upload'
		});
		
		$scope.pickThumbnail = function(sel) {
//			$scope.$emit('setSelection',[0,0,1,1]);
//			ngJcropConfig.jcrop.aspectRatio = sel.ratio;
//			ngJcropConfig.previewImgStyle['width'] = 200 * (0 + ratio) + 'px';
//			ngJcropConfig.previewImgStyle['height'] = 200 * (1 - ratio) + 'px';
//			alert(200 * (1 - ratio) + 'px');
		}
		
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
					  if(value.active == 'active')
					  {
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
		
		$scope.crop = function(item){
			$scope.cropobj = {}
			// The url or the data64 for the image
			$scope.cropobj.src = '/'+item.src;
			// Must be [x, y, x2, y2, w, h]
			$scope.cropobj.coords = [100, 100, 200, 200, 100, 100];
			// You can add a thumbnail if you want
			$scope.cropobj.thumbnail = true;
		};
		
		$scope.getCrop = function(obj){
			$http.post("/admin/fileupload/getcrop", { obj: obj }).then(function(response) {
				if(ckeditor_func != null)
				{
					window.parent.opener.CKEDITOR.tools.callFunction(ckeditor_func, '/'+response.data.link,function()
					{
					//var element,
					//dialog = this.getDialog();
					
					//element = dialog.getContentElement( 'tab-basic', 'padding' );
					//element.setValue( response.data.resolution[1] / response.data.resolution[0] );
				});
				}
				else
				{
					window.opener.FilePicker.getFromManager(filepickerID, '/'+obj.src);
				}
			window.close();
			});
		};
		
		$scope.select = function(obj){
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
				window.opener.FilePicker.getFromManager(filepickerID, '/'+obj.src);
			}
			window.close();
		};
		
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