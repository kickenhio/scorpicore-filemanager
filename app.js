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
		
		.controller('exampleController', 
		['$scope', '$http', 'FileUploader', function($scope,$http,FileUploader) {
		
		vex.defaultOptions.className = 'vex-theme-default';
		var csrf_token = document.querySelector('input[name="_token"]').getAttribute('value');
		var uploader = $scope.uploader = new FileUploader({
			headers : {
				'X-CSRF-TOKEN': csrf_token
			},
			url: '/admin/fileupload/upload'
		});
		
		uploader.filters.push({
			name: 'customFilter',
			fn: function(item, options) {
				return this.queue.length < 10;
			}
		});
		
		uploader.onBeforeUploadItem = function(item) {
			$scope.list.push({
				name: item.file.name,
				thumb: 'loading'
			});
		};
		uploader.onProgressItem = function(fileItem, progress) {
			var index = $scope.list.map(function(e) { return e.name; }).indexOf(fileItem.file.name);
			$scope.list[index]['percent'] = progress;
		};
		
		uploader.onSuccessItem = function(fileItem, response, status, headers) {
			fileItem.remove();
			var index = $scope.list.map(function(e) { return e.name; }).indexOf(fileItem.file.name);
			$scope.list[index] = response;
		};
		
		var controller = $scope.controller = {
			isImage: function(item) {
				var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
				return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
			}
		};
		
		
		$http.get("/admin/fileupload/load").then(function(response) {
			$scope.list = response.data;
			console.log(response.data);
		});
		
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
				window.parent.opener.CKEDITOR.tools.callFunction(ckeditor_func, '/'+response.data.link,function(){
					var element,
					dialog = this.getDialog();
					
					element = dialog.getContentElement( 'tab-basic', 'padding' );
					element.setValue( response.data.resolution[1] / response.data.resolution[0] );
				});
			window.close();
			});
		};
		
		$scope.select = function(obj){
			window.parent.opener.CKEDITOR.tools.callFunction(ckeditor_func, '/'+obj.src, function(){
				var element,
        		dialog = this.getDialog();
				
				element = dialog.getContentElement( 'tab-basic', 'padding' );
				element.setValue( obj.resolution[1] / obj.resolution[0] );
			});
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