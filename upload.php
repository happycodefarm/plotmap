<?php
	session_start();
	
	//print_r(ini_get_all());
	
	error_log($_SERVER["CONTENT_LENGTH"]);
	error_log((int)ini_get('post_max_size')*1024*1024);
	
	if (isset($_SERVER["CONTENT_LENGTH"])) {
		if($_SERVER["CONTENT_LENGTH"]>((int)ini_get('post_max_size')*1024*1024)) {
			error_log("TO BIG FILE");
			$array = array();
			array_push($array,array('name'=>"big upload", 'error'=>1, 'type'=>"none"));
			
			echo(json_encode($array));
			return;
		}
	}
		
	$inactive = 600;

	// check to see if $_SESSION["timeout"] is set
	if (isset($_SESSION["timeout"])) {
		// calculate the session's "time to live"
		$sessionTTL = time() - $_SESSION["timeout"];
		if ($sessionTTL > $inactive) {
			session_unset();
			session_regenerate_id();
		}
	}

	$_SESSION["timeout"] = time();
	
	// check user session credential
	/*if (!empty($_SESSION['user_name'])) {
		error_log("upload, user '".$_SESSION['user_name']."' credential ok");
		
	} else {
		error_log("upload, user '".$_SESSION['user_name']."' no credential");
		die("not logged");
	}*/
		
	error_log("uploading");

// 	
	$fn = (isset($_SERVER['HTTP_X_FILENAME']) ? urldecode($_SERVER['HTTP_X_FILENAME']) : false);
	$ft = (isset($_SERVER['HTTP_X_FILETYPE']) ? urldecode($_SERVER['HTTP_X_FILETYPE']) : false);
	//$fp = (isset($_SERVER['HTTP_X_FILEPATH']) ? urldecode($_SERVER['HTTP_X_FILEPATH']) : "/");
	//print_r($_SERVER);
	if ($fn) {

		// AJAX call
		$files = file_get_contents('php://input');
		
		
		file_put_contents(
			'files/'.$fn,
			$files
		);
		
		$exif = exif_read_data('files/'.$fn);
		
		$lon = getGps($exif["GPSLongitude"], $exif['GPSLongitudeRef']);
		$lat = getGps($exif["GPSLatitude"], $exif['GPSLatitudeRef']);

		$array = array('name'=>$fn, 'type'=>$ft, 'lon'=>$lon, 'lat'=>$lat);
		echo json_encode($array);
	
		exit();

	}
	else {
		// form submit
		//error_log(print_r($_SERVER,true));
		
		$files = $_FILES['plotmap_uploaded_files'];
		
		
		$array = array();
		
 		foreach ($files['error'] as $id => $err) {// 
			if ($err == UPLOAD_ERR_OK) {
				
				$fileName = $files['name'][$id];
				$fileType = $files['type'][$id];
				
				error_log("uploading ".$fileName);
				
				move_uploaded_file(
					$files['tmp_name'][$id],
					"files/$fileName"
				);
				
						
				$exif = exif_read_data('files/'.$fn);
		
				$lon = getGps($exif["GPS"], $exif['GPSLongitude']);
				$lat = getGps($exif["GPS"], $exif['GPSLatitude']);

				array_push($array,array('name'=>$fileName, 'error'=>$err, 'type'=>$fileType, 'lon'=>$lon, 'lat'=>$lat));
			} else {
				error_log("ERROR uploading ".$fileName." ".$err);
				array_push($array,array('name'=>$fileName, 'error'=>$err, 'type'=>$fileType));
			}
		}
		// send back files array for validation
		echo json_encode($array);
	}
	
	function getGps($exifCoord, $hemi) {

		$degrees = count($exifCoord) > 0 ? gps2Num($exifCoord[0]) : 0;
		$minutes = count($exifCoord) > 1 ? gps2Num($exifCoord[1]) : 0;
		$seconds = count($exifCoord) > 2 ? gps2Num($exifCoord[2]) : 0;

		$flip = ($hemi == 'W' or $hemi == 'S') ? -1 : 1;

		return $flip * ($degrees + $minutes / 60 + $seconds / 3600);
	}

	function gps2Num($coordPart) {

		$parts = explode('/', $coordPart);

		if (count($parts) <= 0)
			return 0;

		if (count($parts) == 1)
			return $parts[0];

		return floatval($parts[0]) / floatval($parts[1]);
	}
?>
	