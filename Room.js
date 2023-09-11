/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import { Button, Icon } from '@rneui/base';
import 'fast-text-encoding';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  findNodeHandle,
  Text,
  TouchableOpacity,
  NativeModules,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Alert,
  BackHandler,
  Pressable,
} from 'react-native';
import HeaderComponent from '../../../components/HeaderComponent';
import fonts from '../../../assets/fonts';
import { useRoom, useParticipant, AudioSession } from '@livekit/react-native';
import {
  ScreenCapturePickerView,
  mediaDevices,
} from '@livekit/react-native-webrtc';
import { startCallService, stopCallService } from './callservice/CallService';
import { DataPacket_Kind, Room, RoomEvent } from 'livekit-client';
import { useSelector } from 'react-redux';
import commonStyles from '../../../styles/commonStyles';
import {
  moderateScale,
  moderateScaleVertical,
  width,
} from '../../../utils/responsiveSize';
import Toast from '../../../components/Toast';';
import RoomController from './Components/RoomController';
import RoomLoaderModal from './Components/RoomLoaderModal';
import { ParticipantView } from './Components/ParticipantView';
import Audience from './Components/Audience';

const VideoCallPage = (props) => {
  const route = props.route;
  const { userDetails } = useSelector((state) => state.user);
  const { token, url, roomDetails, host, room_id, userName } = route.params;
  const [isHost, setIsHost] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setCanPublish(host === userDetails._id);
    setIsHost(host === userDetails._id);
  }, [host, userDetails]);

  const [room] = useState(
    () =>
      new Room({
        publishDeaults: { simulcast: false },
        adaptiveStream: true,
        dynacast: true,
      })
  );

  const { participants } = useRoom(room);
  const [canPublish, setCanPublish] = useState(false);
  const { screenSharePublication } = useParticipant(room?.localParticipant);
  const { theme } = useSelector((state) => state.theme);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  const [fullScreenParticipant, setFullScreenParticipant] =
    React.useState(null);
  const [isCameraFrontFacing, setCameraFrontFacing] = useState(true);
  const [onstageIdentity, setOnStageIdenity] = useState('');

  useEffect(() => {
    startCallService();
    return () => {
      stopCallService();
    };
  }, [url, token, room]);

  // Connect to room?.
  useEffect(() => {
    let connect = () => {
      console.log('[LiveKit] Starting audio session...', url, token);
      AudioSession.startAudioSession().then(() => {
        console.log('[LiveKit] Audio session started');
      });
      room
        .connect(url, token, {})
        .then((res) => {
          console.log('[LiveKit] Room connected', res);
          setIsConnected(true);
        })
        .catch((err) => {
          console.log('errOr here', err);
        });
      console.log('[LiveKit] Room connected');
    };

    connect();
    return () => {
      room?.disconnect();
      room?.removeAllListeners();
      AudioSession.stopAudioSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, token, room]);

  const screenCaptureRef = React.useRef(null);

  const startBroadcast = async () => {
    if (Platform.OS === 'ios') {
      const reactTag = findNodeHandle(screenCaptureRef.current);
      await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
      room.localParticipant.setScreenShareEnabled(true);
      room.localParticipant.setCameraEnabled(false);
      const message = {
        user: userDetails,
        identity: room.localParticipant.identity,
        messageBody: '',
        createdAt: Date.now(),
        type: 'handleScreenShare',
      };
      setOnStageIdenity('');
      sendCustomData(message);
    } else {
      room.localParticipant.setScreenShareEnabled(true);
      room.localParticipant.setCameraEnabled(false);
      const message = {
        user: userDetails,
        identity: room.localParticipant.identity,
        messageBody: '',
        createdAt: Date.now(),
        type: 'handleScreenShare',
      };
      sendCustomData(message);
    }
  };

  const stopBroadcast = () => {
    room?.localParticipant?.setScreenShareEnabled(false);
    room.localParticipant.setCameraEnabled(false);
    setOnStageIdenity((prev) => {
      return room?.localParticipant?.identity === onstageIdentity ? '' : prev;
    });
  };

  //
  const sendMessage = (text) => {
    if (room?.localParticipant?.permissions?.canPublishData) {
      const message = {
        user: userDetails,
        messageBody: text,
        createdAt: Date.now(),
        type: 'message',
      };
      sendCustomData(message);
      setMessages((prev) => [...prev, message]);
    } else {
      Toast("You don't have enough permission yet");
    }
  };

  // send custom data
  const sendCustomData = useCallback(
    (data) => {
      // console.log('data', data);
      if (room?.localParticipant?.permissions?.canPublishData) {
        console.log('data', data);
        const strData = JSON.stringify(data);
        // eslint-disable-next-line no-undef
        const encoder = new TextEncoder();
        // room?.localParticipant?.publishData;
        room?.localParticipant?.publishData(
          encoder.encode(strData),
          DataPacket_Kind.RELIABLE
        );
        console.log('data sent2', data);
      } else {
        Toast("You don't have enough permission yet");
      }
    },
    [room?.localParticipant]
  );

  // listen to data
  const handleData = useCallback(
    (data) => {
      // eslint-disable-next-line no-undef
      const decoder = new TextDecoder();
      const jsonData = decoder.decode(data);
      const strData = JSON.parse(jsonData);
      console.log(strData, '......');
      switch (strData.type) {
        case 'handraise': {
          break;
        }
        case 'cohost':
          break;
        case 'kicked':
          break;
        case 'message':
          // console.log('message');

          break;
        case 'askToJoin':
          break;
        case 'handleScreenShare':
          if (strData?.user?.userId !== userDetails._id) {
            Toast(
              `Your presentation has ended as ${strData?.user?.name} has taken over in this room.`
            );
            // console.log('SOMEONE IS SHARING THERE SCREEN', strData.identity);
            setOnStageIdenity(strData.identity);
            stopBroadcast();
            room?.localParticipant?.setCameraEnabled(false);
          }
          break;
        case 'acceptRequest':
          break;
      }
    },
    [host, room?.localParticipant?.metadata, userDetails._id]
  );

  useEffect(() => {
    if (!room && !userDetails._id) {
      return;
    }
    if (room?.state === 'connecting') {
      // alert('renderrrrrr');
      room?.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        console.log('speakers Changed', speakers);
      });
      room?.on(RoomEvent.TrackSubscribed, (track) => {
        // console.log('track subscribed', track);
        // alert('track subscribed');
      });
      room?.on(RoomEvent.TrackPublished, (track) => {
        // console.log('NEWEWEWEWE track published', track);
        // alert('track published');
      });
      room?.on(RoomEvent.Disconnected, () => {
        Toast('Room has been disconnected');
        setPreventGoBack(false);
        // if(userDetails?._id===)
        // setDisconnectedParticipant(room?.localParticipant);
      });
      room?.on(RoomEvent.DataReceived, handleData);
      room?.on(RoomEvent.Connected, () => {
        // alert('connected');
        console.log('room', room);
        setCanPublish(room?.localParticipant?.permissions.canPublish);
      });
    }
  }, [handleData, room, userDetails._id]);

  return (
    <View style={styles.mainView(theme)}>
      <View style={styles.mainView(theme)}>
        {isConnected ? (
          <>
            {isTrackEnabled(screenSharePublication) && (
              <Pressable
                style={{
                  flex: 1,
                  flexDirection: 'column',
                  height: moderateScale(260),
                  width: Dimensions.get('window').width,
                  borderRadius: moderateScale(10),
                  overflow: 'hidden',
                  backgroundColor: 'grey',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  stopBroadcast();
                }}
              >
                <Text style={styles.textStyle(theme)}>
                  You're sharing your screen. Tap on the screen to stop sharing.
                </Text>
              </Pressable>
            )}

            {onstageIdentity?.length > 0 && (
              <View
                style={{
                  width: width,
                  backgroundColor: '#fff',
                  maxWidth: Dimensions.get('window').width,
                  // marginRight: index === 3 ? 95 : 5,
                  margin: 5,
                  height: 242.98,
                  // backgroundColor: 'red',
                  borderRadius: 5,
                }}
              >
                <ParticipantView
                  participant={room.getParticipantByIdentity(onstageIdentity)}
                  host={host}
                  isFullScreen={isFullScreen}
                  setIsFullScreen={setIsFullScreen}
                  setFullScreenParticipant={setFullScreenParticipant}
                  isCameraFrontFacing={isCameraFrontFacing}
                  resizeMode={'contain'}
                />
              </View>
            )}
            <View
              style={{
                width: width,
                height: moderateScale(265),
                backgroundColor: 'black',
              }}
            >
              <FlatList
                data={participants}
                // getItemLayout={getItemLayout}
                renderItem={({ item, index }) => {
                  return (
                    <Audience
                      item={item}
                      setShowActionSheet={setShowActionSheet}
                      setActionSheetData={setActionSheetData}
                      index={index}
                      host={host}
                    />
                  );
                }}
                numColumns={4}
                keyExtractor={(item, index) => item.identity}
              />
            </View>
          </>
        ) : (
          <RoomLoaderModal setModalVisible={true} />
        )}
      </View>
      <View style={{ backgroundColor: '#3A3A3A', width: '100%', height: 1 }} />
      <RoomController
        stopBroadcast={stopBroadcast}
        startBroadcast={startBroadcast}
      />
    </View>
  );
};
export default VideoCallPage;

function isTrackEnabled(pub) {
  return !(pub?.isMuted ?? true);
}

const styles = StyleSheet.create({
  image: {
    width: '50%',
    height: '50%',
  },
  mainView: (theme) => ({
    flex: 1,
    backgroundColor: theme?.background,
  }),
  viewStyle1: {
    flexDirection: 'row',
    marginLeft: moderateScale(10),
    marginRight: moderateScale(10),
    alignItems: 'center',
    top: moderateScale(-8),
  },
  iconStyle: { marginRight: 12, marginLeft: moderateScale(8) },
  viewStyle2: {
    flexDirection: 'row',
    flex: 1,
    marginBottom: moderateScale(13),
    marginTop: moderateScale(10),
    alignItems: 'center',
  },
  viewStyle3: {
    marginLeft: moderateScale(10),
    flex: 1,
    top: 2,
  },
  textStyle: (theme) => ({
    color: theme.text,
    width: '85%',
    fontFamily: fonts.robotoMedium,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    left: moderateScale(10),
    bottom: moderateScale(4),
    // letterSpacing: 0.5,
  }),
  textStyle98: (theme) => ({
    color: theme.accent,
    flex: 1,
    fontFamily: fonts.robotoMedium,
    fontSize: moderateScale(14),
    fontWeight: '500',
  }),
  viewStyle4: (theme) => ({
    backgroundColor: theme?.background,
    padding: 20,
    borderRadius: 10,
    width: '80%',
  }),
  textStyle1: (theme) => ({
    color: theme?.text,
    ...commonStyles.fontBold18,
  }),
  viewStyle5: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewStyle6: {
    height: '100%',
    marginHorizontal: 10,
  },
  textStyle2: (theme) => ({
    color: theme?.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  }),
  seeProfile: {
    flexDirection: 'row',
    padding: 2,
    marginTop: moderateScale(15),
  },
  seeProfileText: (theme) => ({
    fontSize: 18,
    color: theme?.text,
    fontFamily: fonts.robotoRegular,
    fontWeight: '300',
    marginLeft: moderateScale(10),
  }),
  seeProfileText1: (theme) => ({
    fontSize: 18,
    color: '#FF5F5F',
    fontFamily: fonts.robotoRegular,
    fontWeight: '300',
    marginLeft: moderateScale(10),
  }),
  imageStyle54: { marginLeft: moderateScale(10) },
});
