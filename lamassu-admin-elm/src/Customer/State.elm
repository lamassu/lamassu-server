module Customer.State exposing (..)

import RemoteData exposing (..)
import Customer.Rest exposing (..)
import Customer.Types exposing (..)


init : Model
init =
    NotAsked


load : String -> ( Model, Cmd Msg )
load id =
    ( Loading, getCustomer id )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Load loadedModel ->
            loadedModel ! []

        PatchCustomer id fieldName value ->
            model ! [ patchCustomer id fieldName value ]
