module Pair exposing (..)

import Html exposing (Html, Attribute, h1, a, div, hr, input, span, text, node, button, strong, label)
import Html.Attributes exposing (id, attribute, placeholder, disabled, style, size)
import Html.Events exposing (onClick, onInput)
import Http
import HttpBuilder exposing (..)
import String
import RemoteData exposing (RemoteData(NotAsked, Loading, Failure, Success))
import QRCode
import Css.Admin exposing (..)
import Css.Classes as C
import QRCode.ECLevel as ECLevel


-- MODEL


type alias Model =
    { totem : RemoteData.WebData String
    , name : String
    , serverStatus : Bool
    }


getTotem : String -> Cmd Msg
getTotem name =
    get "/api/totem"
        |> withQueryParams [ ( "name", name ) ]
        |> withExpect Http.expectString
        |> send RemoteData.fromResult
        |> Cmd.map Load


init : Bool -> Model
init serverStatus =
    { totem = RemoteData.NotAsked
    , name = ""
    , serverStatus = serverStatus
    }



-- UPDATE


type Msg
    = Load (RemoteData.WebData String)
    | InputName String
    | SubmitName


updateStatus : Bool -> Model -> Model
updateStatus isUp model =
    { model | serverStatus = isUp }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Load webData ->
            let
                _ =
                    Debug.log "TOTEM" (RemoteData.withDefault "Network Error" webData)
            in
                { model | totem = webData } ! []

        InputName name ->
            { model | name = name } ! []

        SubmitName ->
            model ! [ getTotem model.name ]


qrCode : String -> Html msg
qrCode s =
    let
        resultQRCode =
            QRCode.toSvgWithECLevel s ECLevel.L
    in
        case resultQRCode of
            Result.Ok view ->
                view

            Result.Err err ->
                Html.text (toString err)


view : Model -> Html Msg
view model =
    if model.serverStatus then
        case model.totem of
            NotAsked ->
                div []
                    [ h1 [] [ text "Pair a new Lamassu cryptomat" ]
                    , div []
                        [ label []
                            [ text "Cryptomat name"
                            , input
                                [ onInput InputName
                                , placeholder "Coffee shop, 43 Elm St."
                                , size 50
                                , style [ ( "margin-left", "1em" ) ]
                                ]
                                []
                            , button
                                [ onClick SubmitName, disabled (String.isEmpty model.name) ]
                                [ text "Pair" ]
                            ]
                        ]
                    ]

            Loading ->
                div []
                    [ div [] [ text "..." ] ]

            Failure err ->
                div [] [ text (toString err) ]

            Success totem ->
                div
                    []
                    [ div
                        [ class [ C.QrCode ] ]
                        [ qrCode totem ]
                    , div []
                        [ span [] [ text "Scan this QR Code to pair " ]
                        , strong [] [ text model.name ]
                        ]
                    ]
    else
        div [] [ text "Make sure lamassu-server is up before pairing" ]
