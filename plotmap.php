<?php

$str_json = file_get_contents('php://input');
$ip = $_SERVER['REMOTE_ADDR'];

$GLOBALS['plot_db'] = db_connect();
$GLOBALS['answer'] = array();

session_start();
$inactive = 600; // 10 minutes of credential

// check to see if $_SESSION["timeout"] is set
if (isset($_SESSION["timeout"])) {
	// calculate the session's "time to live"
	$sessionTTL = time() - $_SESSION["timeout"];
	if ($sessionTTL > $inactive) {
		session_unset();
		session_regenerate_id();
	}
}
$actions = ["tiemout"=>"pmTimeOut"];

// timeout request
if (plotGetRequest('timeout')!=null) {
	$credential = ["credential"=>pmCheckLogin()==true?1:0];
	addAnswer($credential,true);
}


$_SESSION["timeout"] = time();

// handle logout
if (plotGetRequest('logout')!=null) {
	session_unset();
	session_regenerate_id();
	addAnswer($credential,false);
}

$credential = ["credential"=>pmCheckLogin()==true?1:0];

addAnswer($credential);

// settings fetch & save
if (plotGetRequest('settings')!=null) {
	if (pmCheckLogin() && plotGetRequest('save')!=null) {
		// save settings

		$object = json_decode(file_get_contents('php://input'));
		
		$siteTitle = SQLite3::escapeString($object->{'siteTitle'});
		$siteSubtitle = SQLite3::escapeString($object->{'siteSubtitle'});
		$titleColor = SQLite3::escapeString($object->{'titleColor'});
		$backgroundColor = SQLite3::escapeString($object->{'backgroundColor'});

		$request = "UPDATE settings SET siteTitle='$siteTitle',siteSubtitle='$siteSubtitle',titleColor='$titleColor',backgroundColor='$backgroundColor' WHERE id = 0";
		$results = $GLOBALS['plot_db']->exec($request);
	}
	
	$result = $GLOBALS['plot_db']->querySingle('SELECT * FROM settings WHERE id=0',true);
	
	$settings = array();
	$settings['siteTitle'] = 		$result['siteTitle']; 
	$settings['siteSubtitle'] = 		$result['siteSubtitle']; 
	$settings['backgroundColor'] = 		$result['backgroundColor'];
	$settings['titleColor'] = 		$result['titleColor'];

	addAnswer(["settings"=>$settings]);
}

// create new user
if (plotGetRequest('newuser')!=null) {

	if (pmCheckLogin()==false) {
		error_log("new user failed: bad permission\n",3,"plotlog.log");
		addAnswer(["new_user"=>0]);
		addAnswer(["error"=>"no permission"]);
	} else {
		$object = json_decode(file_get_contents('php://input'));
		$login = $object->{'new-user-login'};
		$password = $object->{'new-user-password'};
	
		if (!pmCheckLogin()) return;

		$request = "INSERT INTO users (login,password) VALUES ('$login','$password')";
	
		if ($GLOBALS['plot_db']->exec($request)) {
			//error_log("new user: ".$login."pass:".$password."\n",3,"plotlog.log");
			addAnswer(["new_user"=>1]);
		} else {
			//error_log("bad user: ".$login."pass:".$password."\n",3,"plotlog.log");
			addAnswer(["new_user"=>0]);
		}
	}
}

if  (plotGetRequest('fetch')!=null) {
	$object = json_decode(file_get_contents('php://input'));
	$map = $object->{'map'}; //  get map value	
	$markers = getMapMarkers($map);

	addAnswer(["markers"=>$markers]);
}

if  (plotGetRequest('maps')!=null) {

	$maps = getMaps();
	addAnswer(["maps"=>$maps]);
}

if  (plotGetRequest('overlays')!=null) {

	$overlays = getOverlays();
	addAnswer(["overlays"=>$overlays]);
}


if (pmCheckLogin() && plotGetRequest('create')!=null) {
	createMapMarker();
}

if (plotGetRequest('attributes')!=null) {
	$attributes = getMarkersAttributes();
	addAnswer(["attributes"=>$attributes]);
}

if (plotGetRequest('groups')!=null) {
	$markerGroups = getMarkersGroups();
	addAnswer(["groups"=>$markerGroups]);
}

if (plotGetRequest('thumbnail')!=null) {
	plotMapGetImageThumbnail(plotGetRequest('thumbnail'));
}

if (pmCheckLogin() && plotGetRequest('update')!=null) {
	
	// get JSON object
	$object = json_decode(file_get_contents('php://input'));

	$id = $object->{'id'};
	$map = SQLite3::escapeString($object->{'map'});
	$title = SQLite3::escapeString($object->{'title'});
	$lat = $object->{'lat'};
	$lng = $object->{'lng'};
	$type = SQLite3::escapeString($object->{'type'});
	$content = SQLite3::escapeString($object->{'content'});
	$preview = SQLite3::escapeString($object->{'preview'});
	$attributes = SQLite3::escapeString($object->{'attributes'});
	$locked = $object->{'locked'}==false?0:1;

	$request = "UPDATE markers SET title='$title',map='$map',preview='$preview',type='$type',content='$content',attributes='$attributes',lat=$lat,lng=$lng,locked=$locked WHERE id LIKE $id";

	if ($GLOBALS['plot_db']->exec($request)) {
		addAnswer(["update"=>1]);
	} else {
		addAnswer(["update"=>0]);
	}
	
}

if (pmCheckLogin() &&  plotGetRequest('remove')!=null) {
		
	// get JSON object
	$object = json_decode(file_get_contents('php://input'));
	
	$id = $object->{'id'};
	
	$request = "DELETE FROM markers WHERE id LIKE $id";
	$results = $GLOBALS['plot_db']->exec($request);
	
	error_log($request."\n",3,"plotlog.log");
	error_log($results."\n",3,"plotlog.log");
		
	if ($GLOBALS['plot_db']->exec($request)) {
		addAnswer(["remove"=>1]);
	} else {
		addAnswer(["remove"=>0]);
	}	
}


if (plotGetRequest('geojson')!=null) {
	$adb = new SQLite3('../fret/fret.db');

	$request = "SELECT lng, lat FROM points";

	$results = $adb->query($request);
	
	if ($results == true) {
		$coordinatesArray = array();
		while ($row = $results->fetchArray()) {
			$pointArray = array($row["lng"], $row["lat"]);
			array_push($coordinatesArray, $pointArray);
			
			// touch point
			$id = $row["id"];
			$update_request = "UPDATE points SET touched=1 WHERE id LIKE '$id'";
			$update_result = $GLOBALS['plot_db']->exec($update_request);
			
		}
		
		$geojson = array(
   			'type'      => 'LineString',
   			'coordinates'  => $coordinatesArray
		);


		$GLOBALS['answer'].push($geojson);

	}
	
	$adb->close();
}



validateAnswer();

// functions

function getMarkerWithID($markerID) {
	$request = "SELECT * FROM markers WHERE id LIKE $markerID";
	$result = $GLOBALS['plot_db']->exec($request);
	
	$marker = array();
	$marker['id'] = 		$result['id']; 
	$marker['map'] = 		$result['map'];
	 
	$marker['title'] = 		$result['title'];
	$marker['type'] = 		$result['type'];
	$marker['preview'] = 	$result['preview'];
	$marker['content'] = 	$result['content'];
	$markers['attributes'] =	explode(",",$result['attributes']); //$res['attributes'];
	$markers['attributes'] = 	array_map('trim', $markers['attributes']);
	
	$marker['date'] = 		$result['date']; 
	$marker['lng'] = 		$result['lng']; 
	$marker['lat'] =		$result['lat']; 
	$marker['locked'] =		$result['locked'];
	$marker['icon'] = 		$result['icon'];
	
	addAnswer(["markers"=>$markers]);
}


function getMaps() {
	$request = "SELECT * FROM maps";
	
	error_log($request);
	
	$results = $GLOBALS['plot_db']->query($request);
	
	$maps = array();
	$i = 0; 
	while($res = $results->fetchArray(SQLITE3_ASSOC)){ 
		
		
		if(!isset($res['id'])) continue; 

		$maps[$i]['id'] = 				$res['id']; 
		$maps[$i]['url'] = 				$res['url'];
		$maps[$i]['name'] = 			$res['name'];
		$maps[$i]['attribution'] = 		$res['attribution'];
		$maps[$i]['maxZoom'] = 			$res['maxZoom'];
		$maps[$i]['minZoom'] = 			$res['minZoom'];
		$maps[$i]['reuseTiles'] = 		$res['reuseTiles']==1 ? "true" : "false";
		
		$maps[$i]['boundsLatNorth'] = 			$res['boundsLatNorth'];
		$maps[$i]['boundsLongEast'] = 			$res['boundsLongEast'];
		$maps[$i]['boundsLatSouth'] = 			$res['boundsLatSouth'];
		$maps[$i]['boundsLongWest'] = 			$res['boundsLongWest'];
		
		$i++; 
    }
    
	return $maps;
}

function getOverlays() {
	$request = "SELECT * FROM overlays";
	
	error_log($request);
	
	$results = $GLOBALS['plot_db']->query($request);
	
	$overlays = array(); 
	$i = 0; 
    
	while($res = $results->fetchArray(SQLITE3_ASSOC)){ 
		
		if(!isset($res['id'])) continue; 

		$overlays[$i]['id'] = 				$res['id']; 
		$overlays[$i]['url'] = 				$res['url'];
		$overlays[$i]['name'] = 			$res['name'];
		$overlays[$i]['attribution'] = 		$res['attribution'];
		
		$overlays[$i]['maxZoom'] = 			$res['maxZoom'];
		$overlays[$i]['minZoom'] = 			$res['minZoom'];
		$overlays[$i]['reuseTiles'] = 		$res['reuseTiles']==1 ? "true" : "false";
		
		$overlays[$i]['boundsLatNorth'] = 			$res['boundsLatNorth'];
		$overlays[$i]['boundsLongEast'] = 			$res['boundsLongEast'];
		$overlays[$i]['boundsLatSouth'] = 			$res['boundsLatSouth'];
		$overlays[$i]['boundsLongWest'] = 			$res['boundsLongWest'];
		
		$i++; 
    }
    
	return $overlays;
}

function getMarkerContent($markerID) {

	$request = "SELECT content FROM markers WHERE id LIKE $markerID";
	$content = $GLOBALS['plot_db']->querySingle($request);
	
	return $content;
}

function getMarkersAttributes() {

	$request = "SELECT attributes FROM markers WHERE attributes NOT NULL";
	$results = $GLOBALS['plot_db']->query($request);
	
	$allAttributesArray = array();
	while ($attributes = $results->fetchArray()) {
		
    	$allAttributesArray = array_merge($allAttributesArray ,explode(",",$attributes[0]));
    }
    
    $allAttributesArray = array_map('trim', $allAttributesArray);
    $allAttributesArray = array_filter($allAttributesArray);
    
	return array_unique($allAttributesArray);
}

function getMarkersGroups() {

	$request = "SELECT attributes FROM markers WHERE attributes NOT NULL";
	$results = $GLOBALS['plot_db']->query($request);
	
	$allAttributesArray = array();
	while ($attributes = $results->fetchArray()) {
		
    	$allAttributesArray = array_merge($allAttributesArray ,explode(",",$attributes[0]));
    }
    
    $allAttributesArray = array_map('trim', $allAttributesArray);
    $allAttributesArray = array_filter($allAttributesArray);
        
	return array_unique($allAttributesArray);
}

function getMapMarkers($map) {

	$request = "SELECT * FROM markers WHERE map LIKE '$map'";
		
	$results = $GLOBALS['plot_db']->query($request);
	
	$markers = array(); 
	$i = 0; 
        
	while($res = $results->fetchArray(SQLITE3_ASSOC)){ 
		if(!isset($res['id'])) continue; 

		$markers[$i]['id'] = 			$res['id']; 
		$markers[$i]['map'] = 			$res['map'];
		 
		$markers[$i]['title'] = 		$res['title'];
		$markers[$i]['type'] = 			$res['type'];
		$markers[$i]['preview'] = 		$res['preview'];
		$markers[$i]['content'] = 		$res['content'];
		$markers[$i]['attributes'] =	explode(",",$res['attributes']); //$res['attributes'];
		$markers[$i]['attributes'] = 	array_map('trim', $markers[$i]['attributes']);
		$markers[$i]['date'] = 			$res['date']; 
		$markers[$i]['lng'] = 			$res['lng']; 
		$markers[$i]['lat'] = 			$res['lat']; 
		$markers[$i]['locked'] = 		$res['locked'];
		$markers[$i]['icon'] = 			$res['icon'];
		$i++; 
    }
    
   return $markers;
}

function createMapMarker() {
	
	$object = json_decode(file_get_contents('php://input'));
	
	$map = SQLite3::escapeString($object->{'map'});
	$title = SQLite3::escapeString($object->{'title'});
	$lat = $object->{'lat'};
	$lng = $object->{'lng'};
	$type = SQLite3::escapeString($object->{'type'});
	$content = SQLite3::escapeString($object->{'content'});
	$preview = SQLite3::escapeString($object->{'preview'});
	$attributes = SQLite3::escapeString($object->{'attributes'});
	$locked = $object->{'locked'}==false?0:1;
	$icon = SQLite3::escapeString($object->{'icon'});
	$request = "INSERT INTO markers (map,lng,lat,type,title,content,preview,attributes,locked,icon) VALUES ('$map',$lng,$lat,'$type','$title','$content','$preview','$attributes',$locked,'$icon')";
	
	if ($GLOBALS['plot_db']->exec($request)) {

		$request = "SELECT last_insert_rowid()";
		$id = $GLOBALS['plot_db']->querySingle($request);
		
		addAnswer(["id"=>$id]);
		
	} else {
		addAnswer(["error"=>"marker create: ".$GLOBALS['plot_db']->lastErrorMsg()]);
	}
}


function pmCheckLogin() {
	error_log("cheking loging\n");
	// check session login 
	
	if (isset($_SESSION['login'])) return true;
	
	error_log("not loged yet\n");
	// check loggin post in json
	$object = json_decode(file_get_contents('php://input'));
	
	if ($object==null) {
		error_log("no login json data\n");
		return false;
	}
	
	$login = @$object->{'login'};
	$password = @$object->{'password'};
	
	$request = "SELECT * FROM users WHERE login = '$login'";
		
	$results = $GLOBALS['plot_db']->query($request);
	
	while ($row = $results->fetchArray()) {
    	error_log($row["password"]." -> ".$row["login"]."\n");
    	if ($row["password"]==md5($password)) {
    		$_SESSION['login']=$login;
    		error_log(" ok logging\n");
    		
    		break;
    	}
	}
	
	error_log("loging with login: ".$login." pass:".$password." validated:".(isset($_SESSION['login'])?1:0)."\n");
	
	return isset($_SESSION['login']);

}

function plotGetRequest($request){
	return isset($_REQUEST[$request])?urldecode($_REQUEST[$request]):null;
}
	
function plotMapGetImageThumbnail($path) {

	$org_info = getimagesize("files/".$path);
	$rsr_org = imagecreatefromjpeg("files/".$path);
	$rsr_scl = imagescale($rsr_org, 200,  $org_info[1]/$org_info[0]*200 ,IMG_BICUBIC_FIXED);
	header('Content-Type: image/png');
	imagepng($rsr_scl);

	imagedestroy($rsr_org);
	imagedestroy($rsr_scl);
}

// utils functions

function addAnswer($array, $validate=false) {
	$GLOBALS['answer'] = array_merge($GLOBALS['answer'],$array);

	if ($validate==true) validateAnswer();
}

function validateAnswer() {
	$GLOBALS['plot_db']->close();
	die(json_encode($GLOBALS['answer']));
}

function trim_value(&$value) 
{ 
    $value = trim($value); 
}

function db_connect() {
	 
    class DB extends SQLite3 {
        function __construct( $file ) {
            $this->open( $file,SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);
        }
    }
    
    $adb = new DB('plotmap.db');

    if ($adb->lastErrorMsg() != 'not an error') {
    	error_log("Database Error: " . $adb->lastErrorMsg()."\n",3,"plotlog.log");
    }
   
    return $adb;
}
?>