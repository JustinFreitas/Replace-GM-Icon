:: Assumes running from Replace GM Icon\build
mkdir "out\ReplaceGMIcon"
copy ..\extension.xml "out\ReplaceGMIcon\"
mkdir "out\ReplaceGMIcon\graphics\icons"
copy ..\graphics\graphics_portraits.xml "out\ReplaceGMIcon\graphics\"
copy ..\graphics\icons\replace_gm_icon.png "out\ReplaceGMIcon\graphics\icons\"
mkdir "out\ReplaceGMIcon\graphics\portraits"
copy ..\graphics\portraits\adnd-with-frame-40.png "out\ReplaceGMIcon\graphics\portraits\"
copy ..\graphics\portraits\ampersand-40.png "out\ReplaceGMIcon\graphics\portraits\"
copy ..\graphics\portraits\cartoon-dm-with-frame-40.png "out\ReplaceGMIcon\graphics\portraits\"
copy ..\graphics\portraits\gm-die-frame-40.png "out\ReplaceGMIcon\graphics\portraits\"
copy ..\graphics\portraits\portrait_gm_token.png "out\ReplaceGMIcon\graphics\portraits\"
cd out
CALL ..\zip-items ReplaceGMIcon
rmdir /S /Q "ReplaceGMIcon\"
copy "ReplaceGMIcon.zip" "Replace GM Icon.ext"
copy "ReplaceGMIcon.zip" "Replace GM Icon.zip"
del "ReplaceGMIcon.zip"
cd ..
explorer .\out
