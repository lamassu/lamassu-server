module Customers.View exposing (..)

import Html exposing (..)
import Html.Attributes exposing (colspan, href)
import Css.Admin exposing (..)
import Css.Classes as C
import RemoteData exposing (..)
import List
import Common.Customer.Types exposing (..)
import Customers.Types exposing (..)
import Date.Extra exposing (toFormattedString)


customerLink : String -> Html Msg
customerLink id =
    a [ href ("/#customer/" ++ id) ] [ text (String.left 8 id) ]


maybeText : Maybe String -> Html Msg
maybeText maybeString =
    text (Maybe.withDefault "" maybeString)


rowView : Customer -> Html Msg
rowView customer =
    tr [ class [] ]
        [ td [] [ customerLink customer.id ]
        , td [] [ text (toFormattedString "yyyy-MM-dd HH:mm" customer.created) ]
        , td [] [ maybeText customer.phone ]
        , td [] [ maybeText customer.name ]
        , td [] [ maybeText customer.status ]
        ]


tableView : Customers -> Html Msg
tableView customers =
    if List.isEmpty customers then
        div [] [ text "No customers yet." ]
    else
        div []
            [ h1 [] [ text "Customers" ]
            , table [ class [ C.TxTable ] ]
                [ thead []
                    [ tr []
                        [ td [] [ text "Id" ]
                        , td [] [ text "Created" ]
                        , td [] [ text "Phone" ]
                        , td [] [ text "Name" ]
                        , td [] [ text "Status" ]
                        ]
                    ]
                , tbody [] (List.map rowView customers)
                ]
            ]


view : Model -> Html Msg
view model =
    case model of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading..." ]

        Failure err ->
            div [] [ text (toString err) ]

        Success customers ->
            div [] [ tableView customers ]
