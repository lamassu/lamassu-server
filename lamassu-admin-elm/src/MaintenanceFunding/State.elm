module MaintenanceFunding.State exposing (..)

import MaintenanceFunding.Rest exposing (..)
import MaintenanceFunding.Types exposing (..)
import RemoteData exposing (..)


init : Model
init =
    NotAsked


load : Maybe String -> ( Model, Cmd Msg )
load maybeCrypto =
    ( Loading, getForm maybeCrypto )


fundingUpdate : SubModel -> ( SubModel, Cmd Msg )
fundingUpdate model =
    model ! []


switchCrypto : String -> Model -> ( Model, Cmd Msg )
switchCrypto crypto model =
    ( Loading, getForm (Just crypto) )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Load newModel ->
            RemoteData.update fundingUpdate newModel

        CryptoSwitch crypto ->
            switchCrypto crypto model
