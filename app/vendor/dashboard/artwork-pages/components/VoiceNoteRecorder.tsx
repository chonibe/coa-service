// app/vendor/dashboard/artwork-pages/components/VoiceNoteRecorder.tsx
import React, { useState, useRef } from 'react';
import { Button, Progress, Input } from '@/components/ui';
import { Mic, Square, Play, Pause, Upload, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface VoiceNoteRecorderProps {
  title: string;
  contentUrl?: string;
  transcript?: string;
  onUpdate: (updates: { title?: string; content_url?: string; transcript?: string }) => void;
  onFileUpload: (file: File, blockType: string) => Promise<any>;
}

const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  title: initialTitle,
  contentUrl: initialContentUrl,
  transcript: initialTranscript,
  onUpdate,
  onFileUpload,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [currentContentUrl, setCurrentContentUrl] = useState(initialContentUrl);
  const [transcript, setTranscript] = useState(initialTranscript);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState<string | null>(initialContentUrl || null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioPlaybackUrl(url);
        onUpdate({ content_url: url }); // Update the block with local URL for immediate preview
        stream.getTracks().forEach(track => track.stop()); // Stop the mic stream
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      toast({
        title: "Recording Failed",
        description: "Please ensure microphone access is granted.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const togglePlayback = () => {
    const audio = audioPlayerRef.current;
    if (audio) {
      if (isPlayingRecorded) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlayingRecorded(!isPlayingRecorded);
    }
  };

  const handleUploadRecorded = async () => {
    if (recordedAudioBlob) {
      setIsUploading(true);
      try {
        await onFileUpload(recordedAudioBlob, 'audio');
        toast({
          title: "Voice Note Uploaded",
          description: "Your recorded voice note has been saved.",
        });
        // The parent component should handle updating the content_url with the public URL
        // After successful upload, the local playback URL can be replaced by the public one if needed
      } catch (err) {
        toast({
          title: "Upload Failed",
          description: "Could not upload voice note.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await onFileUpload(file, 'audio');
        setCurrentContentUrl(URL.createObjectURL(file)); // For immediate preview
        toast({
          title: "Audio File Uploaded",
          description: "Your audio file has been saved.",
        });
      } catch (err) {
        toast({
          title: "Upload Failed",
          description: "Could not upload audio file.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const clearRecording = () => {
    stopRecording();
    setRecordedAudioBlob(null);
    setAudioPlaybackUrl(null);
    setRecordingTime(0);
    setIsPlayingRecorded(false);
    setPlaybackProgress(0);
    onUpdate({ content_url: undefined }); // Clear URL in parent block
  };

  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (audio) {
      const updateProgress = () => {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      };
      const handleEnded = () => setIsPlayingRecorded(false);

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioPlaybackUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const displayUrl = currentContentUrl && !currentContentUrl.startsWith('blob:') ? currentContentUrl : '';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
        <Input
          value={title || ''}
          onChange={(e) => {
            setTitle(e.target.value);
            onUpdate({ title: e.target.value });
          }}
          placeholder="About this piece"
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      <div className="bg-gray-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Record Voice Note</h3>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isRecording ? (
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">Recording... {formatTime(recordingTime)}</p>
              {/* Simple waveform placeholder */}
              <div className="w-48 h-12 bg-red-800 rounded-md flex items-center justify-center animate-pulse">
                <span className="text-white text-xs">Live Waveform</span>
              </div>
              <Button
                onClick={stopRecording}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="h-5 w-5 mr-2" /> Stop Recording
              </Button>
            </div>
          ) : audioPlaybackUrl ? (
            <div className="w-full space-y-2">
              <audio ref={audioPlayerRef} src={audioPlaybackUrl} onEnded={() => setIsPlayingRecorded(false)} />
              <div className="flex items-center space-x-2">
                <Button onClick={togglePlayback} className="bg-green-600 hover:bg-green-700 text-white">
                  {isPlayingRecorded ? <Pause /> : <Play />}
                </Button>
                <Progress value={playbackProgress} className="flex-grow h-2" />
              </div>
              <div className="text-sm text-gray-400 text-right">{formatTime(audioPlayerRef.current?.currentTime || 0)} / {formatTime(audioPlayerRef.current?.duration || 0)}</div>
              <div className="flex justify-end space-x-2 mt-2">
                {!isUploading && (
                  <Button
                    variant="outline"
                    onClick={handleUploadRecorded}
                    disabled={isUploading}
                    className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
                  >
                    <Upload className="h-4 w-4 mr-2" /> Upload Recorded Note
                  </Button>
                )}
                {isUploading && (
                  <Button disabled className="bg-gray-800 text-white border-gray-700">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={clearRecording}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={startRecording} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Mic className="h-5 w-5 mr-2" /> Start Recording
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-6">
          <div className="flex-1 h-px bg-gray-600" />
          <span className="text-xs text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-600" />
        </div>

        <div className="space-y-2">
          <label htmlFor="audio-file-upload" className="block text-sm font-medium text-gray-300">Upload Audio File</label>
          <Input
            id="audio-file-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="bg-gray-700 border-gray-600 text-gray-200 file:text-white file:bg-gray-600 hover:file:bg-gray-500 file:border-none"
          />
          <p className="text-xs text-gray-500">MP3, WAV, M4A up to 20MB</p>
        </div>

        {displayUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Audio URL</label>
            <Input value={displayUrl} readOnly className="bg-gray-800 border-gray-700 text-gray-400" />
          </div>
        )}

      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Transcript (optional)</label>
        <textarea
          value={transcript || ''}
          onChange={(e) => {
            setTranscript(e.target.value);
            onUpdate({ transcript: e.target.value });
          }}
          placeholder="Automatic transcript will appear here, or you can type your own."
          rows={5}
          className="w-full p-3 bg-gray-700 rounded-md text-gray-200 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">💡 Tip: A transcript improves accessibility.</p>
      </div>
    </div>
  );
};

export default VoiceNoteRecorder;
