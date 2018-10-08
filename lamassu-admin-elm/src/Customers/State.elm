module Customers.State exposing (..)

import RemoteData exposing (..)
import Customers.Rest exposing (..)
import Customers.Types exposing (..)


init : Model
init =
    NotAsked


loadCmd : Cmd Msg
loadCmd =
    getCustomers


load : ( Model, Cmd Msg )
load =
    ( Loading, loadCmd )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Load loadedModel ->
            loadedModel ! []
