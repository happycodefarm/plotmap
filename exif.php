<?php
echo "test.jpg:<br />\n";
$exif = exif_read_data('test.jpg', 'IFD0');
echo $exif===false ? "No header data found.<br />\n" : "Image contains headers<br />\n";

$exif = exif_read_data('test.jpg', 0, true);
echo "test.jpg:<br />\n";
foreach ($exif as $key => $section) {
    foreach ($section as $name => $val) {
        echo "$key.$name: ";
        print_r($val);
    }
}
?>