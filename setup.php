<?php
	define("PLOT_FILES_PATH", "files/");
	define("PLOT_DB_PATH", "db");
	define("PLOT_DB_NAME", "db/plotmap.db");
	
	$json = json_decode(file_get_contents('php://input'));
	
	// $security_string = "Options -ExecCGI\nAddHandler cgi-script .php .php3 .php4 .phtml .pl .py .jsp .asp .htm .shtml .sh .cgi";
// 		file_put_contents(PLOT_FILES_PATH.".htaccess", $security_string);
// 		
		
	// mkdir(PLOT_DB_PATH,0700);
// 	 $db = new SQLite3(PLOT_DB_NAME);
// 	 $query = "CREATE TABLE users (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,login char(128),password char(128));";
// 	 $db->exec($query);
// 	 
// 	 $request = "INSERT INTO users ( login, password ) VALUES(:login, :password)";
// 			$stmt = $db->prepare($request);
// 			$stmt->bindValue(':login', "plot", SQLITE3_TEXT);
// 			$stmt->bindValue(':password',"map", SQLITE3_TEXT);
// 		
// 			$result = $stmt->execute();
// 		
// 	 
// 	 $query = "CREATE TABLE markers (
//   id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
//   title char(128) NOT NULL DEFAULT('unamed'),
//   date char(128) DEFAULT('CURRENT_TIMESTAMP'),
//   map char(128) NOT NULL,
//   preview text(128),
//   lng double(128) NOT NULL DEFAULT(0),
//   lat double(128) NOT NULL DEFAULT(0),
//   content text(128),
//   type char(128),
//   icon char(128),
//   locked integer(128) DEFAULT('0'),
//   attributes text(128),
//   FOREIGN KEY (map) REFERENCES maps (name)
// );";
// 
// 	 $db->exec($query);
// 	 
// 	 die("done");
	 			
	if ($json==true) {
		setup($json);
		die();
	}	
?>	
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>Plotmap Setup</title>
	<link rel="stylesheet" type="text/css" href="setup.css" />
	<script src="setup.js"></script>
</head>
<body>
<h1>Welcome to Plotmap</h1>
<?php
	// check if db is present
	// try {
// 		$db = new SQLite3(PLOT_DB_NAME,SQLITE3_OPEN_READONLY);	
// 		echo ('Plotmap is allready setup');
// 				
// 	} catch (Exception $e) {
		echo ('Please choose a user name and a password<script>plot_build_setup_form()</script>');	
	//}
?>
</body>
</html>
<?php
	
	function setup($json) {	
	
		$response = array ();
				
				
		// try {
// 			$db = new SQLite3(PLOT_DB_NAME,SQLITE3_OPEN_READONLY);	
// 			//chmod(PLOT_DB_NAME,0777);
// 			$response['message'] = 'Plotmap database allready exist';
// 				
// 		} catch (Exception $e) {
			
			// if (is_dir(PLOT_DB_PATH)) { // dir allready exist, cmod it to 0777
// 				if (!@chmod(PLOT_DB_PATH,0755)) echo('<script> alert("db folder failed chmod")</script>');
// 		
// 			} else {
// 				$rs = mkdir(PLOT_DB_PATH,0644);
// 				if( $rs ) {
// 					//echo 'was done!';
// 					@chmod(PLOT_DB_PATH,0644);
// 				} else {
// 					echo('<script>alert("an error occurred while attempting to create the db folder")</script>');
// 				}
// 			}
			
			// create db file
			$db = new SQLite3(PLOT_DB_NAME);
			$query = "CREATE TABLE users (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,login char(128),password char(128));";
			
			$response['message'] = 'Failed to create user table';
			$response['success'] = false;
			$json = json_encode($response);	
			
			$db->exec($query) or die($json);
		
			// create super user	
			$login = "plot"; // $json->{'login'};
			$password = "map"; //md5($json->{'password'});
		
			$request = "INSERT INTO users ( login, password ) VALUES(:login, :password)";
			$stmt = $db->prepare($request);
			$stmt->bindValue(':login', $login, SQLITE3_TEXT);
			$stmt->bindValue(':password', $password, SQLITE3_TEXT);
		
			$result = $stmt->execute();
		
			$query = "CREATE TABLE markers (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  title char(128) NOT NULL DEFAULT('unamed'),
  date char(128) DEFAULT('CURRENT_TIMESTAMP'),
  map char(128) NOT NULL,
  preview text(128),
  lng double(128) NOT NULL DEFAULT(0),
  lat double(128) NOT NULL DEFAULT(0),
  content text(128),
  type char(128),
  icon char(128),
  locked integer(128) DEFAULT('0'),
  attributes text(128),
  FOREIGN KEY (map) REFERENCES maps (name)
);";
			
			$response['message'] = 'Database creation failled';
			$response['success'] = false;
			$json = json_encode($response);	
			$db->exec($query) or die($json);
		
		
			
		//}
		
		chmod(PLOT_DB_NAME,0777);
		
		// create files folder if not exist
		if (is_dir(PLOT_FILES_PATH)) { // dir allready exist, cmod it to 0777
			if (!@chmod(PLOT_FILES_PATH,0777)) echo('<script>alert("failed chmod")</script>');
		
		} else {
			$rs = @mkdir(PLOT_FILES_PATH,0777);
			if( $rs ) {
				//echo 'was done!';
				@chmod(PLOT_FILES_PATH,0777);
			} else {
				echo('<script>alert("an error occurred while attempting to create the files folder")</script>');
			}
		}
	
		// create a .htaccess file to avoid execution of scripts in files folder
		$security_string = "Options -ExecCGI\nAddHandler cgi-script .php .php3 .php4 .phtml .pl .py .jsp .asp .htm .shtml .sh .cgi";
		file_put_contents(PLOT_FILES_PATH.".htaccess", $security_string);
		
		
		$response['success'] = true;	
		$json = json_encode($response);
		die($json);
	}
?>