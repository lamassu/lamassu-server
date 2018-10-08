port module Main exposing (..)

import AccountTypesTests
import ConfigTypesTests
import Test.Runner.Node exposing (run)
import Json.Encode exposing (Value)


main : Program Never
main =
    run emit ConfigTypesTests.all


port emit : ( String, Value ) -> Cmd msg
