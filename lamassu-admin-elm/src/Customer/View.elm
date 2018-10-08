module Customer.View exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick)
import RemoteData exposing (..)
import Css.Admin as CSSAdmin exposing (..)
import Css.Classes as C
import Common.Customer.Types exposing (..)
import Customer.Types exposing (..)
import Date exposing (..)
import Date.Extra exposing (toFormattedString)


customerActions : String -> Authorized -> Html Msg
customerActions id authorizedOverride =
    case authorizedOverride of
        Blocked ->
            button [ onClick (PatchCustomer id "authorizedOverride" Verified) ] [ text "Unblock" ]

        Verified ->
            button [ onClick (PatchCustomer id "authorizedOverride" Blocked) ] [ text "Block" ]

        Automatic ->
            button [ onClick (PatchCustomer id "authorizedOverride" Blocked) ] [ text "Block" ]


formatDate : Maybe Date -> String
formatDate date =
    case date of
        Just date ->
            toFormattedString "yyyy-MM-dd HH:mm" date

        Nothing ->
            ""


maybeText : Maybe String -> Html Msg
maybeText maybeString =
    text (Maybe.withDefault "" maybeString)


actions : String -> String -> Authorized -> Html Msg
actions id fieldKey checkedValue =
    (div []
        [ div []
            [ radio fieldKey checkedValue Automatic (PatchCustomer id fieldKey Automatic)
            , radio fieldKey checkedValue Blocked (PatchCustomer id fieldKey Blocked)
            , radio fieldKey checkedValue Verified (PatchCustomer id fieldKey Verified)
            ]
        ]
    )


radio : String -> Authorized -> Authorized -> msg -> Html msg
radio inputName checkedValue value msg =
    label
        [ style [ ( "padding", "5px" ) ] ]
        [ input [ checked (checkedValue == value), type_ "radio", name inputName, onClick msg ] []
        , text (authorizedToString value)
        ]


verifyStatus : Maybe a -> Authorized -> Html Msg
verifyStatus complianceType fieldOverride =
    if fieldOverride == Verified || (complianceType /= Nothing && fieldOverride == Automatic) then
        text "Verified"
    else
        text "Unverified"


customerView : Customer -> Html Msg
customerView customer =
    div []
        [ h1 [] [ text "Customer Details" ]
        , table [ CSSAdmin.class [ C.TxTable ] ]
            [ tbody []
                [ tr []
                    [ td [] [ text "Customer ID" ]
                    , td [] [ text customer.id ]
                    ]
                , tr []
                    [ td [] [ text "Name" ]
                    , td [] [ maybeText customer.name ]
                    ]
                , tr []
                    [ td [] [ text "Phone" ]
                    , td [] [ maybeText customer.phone ]
                    ]
                , tr []
                    [ td [] [ text "Completed phone at" ]
                    , td [] [ text (formatDate customer.phoneAt) ]
                    ]
                , tr []
                    [ td [] [ text "Created" ]
                    , td [] [ text (toFormattedString "yyyy-MM-dd HH:mm" customer.created) ]
                    ]
                , tr []
                    [ td [] [ text "Block Customer" ]
                    , td []
                        [ customerActions customer.id customer.authorizedOverride ]
                    ]
                , tr []
                    [ td [] [ text "Authorized at " ]
                    , td [] [ text (formatDate customer.authorizedAt) ]
                    ]
                , tr []
                    [ td [] [ text "Daily Volume " ]
                    , td [] [ maybeText customer.dailyVolume ]
                    ]
                ]
            ]
        , h2 [] [ text "Compliance types" ]
        , table [ CSSAdmin.class [ C.TxTable ] ]
            [ thead []
                [ tr []
                    [ td [] [ text "Name" ]
                    , td [] [ text "Date" ]
                    , td [] [ text "Verify Status" ]
                    , td [] [ text "Override Status" ]
                    , td [] [ text "User who overrode" ]
                    , td [] [ text "Actions" ]
                    ]
                ]
            , tbody []
                [ tr []
                    [ td [] [ text "SMS" ]
                    , td [] [ text (formatDate customer.phoneAt) ]
                    , td [] [ verifyStatus customer.phone customer.smsOverride ]
                    , td [] [ text (authorizedToString customer.smsOverride) ]
                    , td [] [ maybeText customer.smsOverrideByName ]
                    , td [] [ actions customer.id "smsOverride" customer.smsOverride ]
                    ]
                , tr []
                    [ td [] [ text "ID Card Data" ]
                    , td [] [ text (formatDate customer.idCardDataAt) ]
                    , td [] [ verifyStatus customer.idCardData customer.idCardDataOverride ]
                    , td [] [ text (authorizedToString customer.idCardDataOverride) ]
                    , td [] [ maybeText customer.idCardDataOverrideByName ]
                    , td [] [ actions customer.id "idCardDataOverride" customer.idCardDataOverride ]
                    ]
                , tr []
                    [ td [] [ text "ID Card Photo" ]
                    , td [] [ text (formatDate customer.idCardPhotoAt) ]
                    , td [] [ verifyStatus customer.idCardPhotoPath customer.idCardPhotoOverride ]
                    , td [] [ text (authorizedToString customer.idCardPhotoOverride) ]
                    , td [] [ maybeText customer.idCardPhotoOverrideByName ]
                    , td [] [ actions customer.id "idCardPhotoOverride" customer.idCardPhotoOverride ]
                    ]
                , tr []
                    [ td [] [ text "Front Facing Camera" ]
                    , td [] [ text (formatDate customer.frontCameraAt) ]
                    , td [] [ verifyStatus customer.frontCameraPath customer.frontCameraOverride ]
                    , td [] [ text (authorizedToString customer.frontCameraOverride) ]
                    , td [] [ maybeText customer.frontCameraOverrideByName ]
                    , td [] [ actions customer.id "frontCameraOverride" customer.frontCameraOverride ]
                    ]
                , tr []
                    [ td [] [ text "Sanctions Check" ]
                    , td [] [ text (formatDate customer.sanctionsAt) ]
                    , td [] [ verifyStatus customer.sanctions customer.sanctionsOverride ]
                    , td [] [ text (authorizedToString customer.sanctionsOverride) ]
                    , td [] [ maybeText customer.sanctionsOverrideByName ]
                    , td [] [ actions customer.id "sanctionsOverride" customer.sanctionsOverride ]
                    ]
                ]
            ]
        , h2 [] [ text "ID Card Photo" ]
        , case customer.idCardPhotoPath of
              Nothing ->
                  text "N/A"

              Just idCardPhotoPath ->
                  div []
                      [ img
                          [ src ("/id-card-photo/" ++ idCardPhotoPath)
                          , height 200
                          , alt "N/A"
                          ] []
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

        Success customer ->
            div [] [ customerView customer ]
