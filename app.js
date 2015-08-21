(function(){
	angular.module('AngularExample', ['angularFileUpload']).controller('exampleController', 
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
		});
			
		$scope.select = function(obj){
			window.parent.opener.CKEDITOR.tools.callFunction(ckeditor_func, '/'+obj.src);
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