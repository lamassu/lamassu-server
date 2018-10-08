port module Stylesheets exposing (..)

import Css.File exposing (CssFileStructure, CssCompilerProgram)
import Css.Main


port files : CssFileStructure -> Cmd msg


fileStructure : CssFileStructure
fileStructure =
    Css.File.toFileStructure
        [ ( "../public/styles.css", Css.File.compile [ Css.Main.css ] ) ]


main : CssCompilerProgram
main =
    Css.File.compiler files fileStructure
