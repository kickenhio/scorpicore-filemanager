(function(){
	angular.module('AngularExample', ['angularFileUpload']).controller('exampleController', ['$scope', '$http', 'FileUploader', function($scope,$http,FileUploader){
		
		var csrf_token = document.querySelector('input[name="_token"]').getAttribute('value');
		
		var uploader = $scope.uploader = new FileUploader({
			headers : {
				'X-CSRF-TOKEN': csrf_token // X-CSRF-TOKEN is used for Ruby on Rails Tokens
			},
			url: '/admin/fileupload/upload'
		});
		
		uploader.filters.push({
			name: 'customFilter',
			fn: function(item, options) {
				return this.queue.length < 10;
			}
		});
		
		uploader.onWhenAddingFileFailed = function(item, filter, options) {
			console.info('onWhenAddingFileFailed', item, filter, options);
		};
		uploader.onAfterAddingFile = function(fileItem) {
			console.info('onAfterAddingFile', fileItem);
		};
		uploader.onAfterAddingAll = function(addedFileItems) {
			console.info('onAfterAddingAll', addedFileItems);
		};
		uploader.onBeforeUploadItem = function(item) {
			console.info('onBeforeUploadItem', item);
		};
		uploader.onProgressItem = function(fileItem, progress) {
			console.info('onProgressItem', fileItem, progress);
		};
		uploader.onProgressAll = function(progress) {
			console.info('onProgressAll', progress);
		};
		uploader.onSuccessItem = function(fileItem, response, status, headers) {
			console.info('onSuccessItem', fileItem, response, status, headers);
		};
		uploader.onErrorItem = function(fileItem, response, status, headers) {
			console.info('onErrorItem', fileItem, response, status, headers);
		};
		uploader.onCancelItem = function(fileItem, response, status, headers) {
			console.info('onCancelItem', fileItem, response, status, headers);
		};
		uploader.onCompleteItem = function(fileItem, response, status, headers) {
			console.info('onCompleteItem', fileItem, response, status, headers);
		};
		uploader.onCompleteAll = function() {
			console.info('onCompleteAll');
		};
		
		console.info('uploader', uploader);
		
		var controller = $scope.controller = {
			isImage: function(item) {
				var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
				return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
			}
		};
		
		vex.defaultOptions.className = 'vex-theme-default';
		
		$http.get("/admin/fileupload/load").then(function(response) {
			$scope.list = response.data;
		});
		
		/* usun */
		$scope.delete = function(index) {
			vex.dialog.confirm({
			  message: 'Czy napewno usunac?',
			  callback: function(value) {
				if(value){
				  	var obj = $scope.list[index];
					$http.post("/admin/fileupload/delete", { name: obj.src }).then(function(response) {
						$scope.list.splice(index, 1);
					});
				}
		  	}});
		};
	}]);
})();