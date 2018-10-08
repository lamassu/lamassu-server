module FieldSet.View exposing (view)

import Html exposing (..)
import Html.Attributes as HA exposing (defaultValue, name, type_, placeholder)
import Html.Events exposing (..)
import FieldSet.Types exposing (..)
import List
import Css.Admin exposing (..)
import Css.Classes as C


fieldComponent : Field -> Html Msg
fieldComponent field =
    let
        inputEl =
            case field.value of
                FieldString string ->
                    input
                        [ onInput (Input field.code), placeholder field.placeholder, defaultValue string ]
                        []

                FieldPassword pass ->
                    case pass of
                        PasswordEmpty ->
                            input
                                [ onInput (Input field.code), name field.code, type_ "password" ]
                                []

                        _ ->
                            input
                                [ onInput (Input field.code), name field.code, type_ "password", placeholder "••• Field is set •••" ]
                                []

                FieldInteger int ->
                    input
                        [ onInput (Input field.code), type_ "number", defaultValue (toString int) ]
                        []
    in
        label []
            [ div [] [ text field.display ]
            , inputEl
            ]


fieldView : Field -> Html Msg
fieldView field =
    div [ class [ C.FormRow ] ] [ fieldComponent field ]


view : Model -> Html Msg
view model =
    div [ class [ C.ConfigContainer ] ] (List.map fieldView model)
