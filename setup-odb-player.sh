#!/bin/bash

# ODB Player Setup Script for OREMUS
echo "🎵 Setting up ODB Player..."

# Create directory structure
echo "📁 Creating directories..."
mkdir -p mobile/src/screens
mkdir -p mobile/src/hooks
mkdir -p mobile/src/services
mkdir -p mobile/src/components/layout
mkdir -p mobile/src/components/common
mkdir -p mobile/src/components/player
mkdir -p mobile/src/data
mkdir -p mobile/src/styles

echo "✅ Directories created!"
echo ""
echo "📋 Now manually copy these files from the artifact:"
echo ""
echo "🎯 MAIN SCREEN:"
echo "   mobile/src/screens/ODBPlayerScreen.jsx"
echo ""
echo "🎣 HOOKS:"
echo "   mobile/src/hooks/useOremusDevice.js"
echo "   mobile/src/hooks/useAudioPlayer.js"
echo "   mobile/src/hooks/useInteractivePrayer.js"
echo "   mobile/src/hooks/usePremiumFeatures.js"
echo ""
echo "🔧 SERVICES:"
echo "   mobile/src/services/audioService.js"
echo "   mobile/src/services/videoService.js"
echo "   mobile/src/services/storageService.js"
echo ""
echo "🎯 COMPONENTS:"
echo "   mobile/src/components/layout/ResponsiveContainer.jsx"
echo "   mobile/src/components/layout/AdaptiveGrid.jsx"
echo "   mobile/src/components/common/GlassCard.jsx"
echo "   mobile/src/components/player/AudioPlayer.jsx"
echo "   mobile/src/components/player/CoursePreview.jsx"
echo ""
echo "📊 DATA:"
echo "   mobile/src/data/audioCategories.js"
echo "   mobile/src/data/sampleTracks.js"
echo "   mobile/src/data/rosaryMysteries.js"
echo ""
echo "🎨 STYLES:"
echo "   mobile/src/styles/oremusColors.js"
echo ""
echo "📦 Installing dependencies..."
cd mobile || { echo "❌ Cannot enter mobile directory!"; exit 1; }

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in mobile directory!"
    echo "Make sure you're in the correct OREMUS directory"
    exit 1
fi

# Install dependencies
npm install expo-av @react-native-async-storage/async-storage lucide-react-native

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "🔧 Adding to package.json dependencies..."

# Create backup of package.json
cp package.json package.json.backup

# Display manual steps
echo "📝 Manual step: Add these to your package.json dependencies:"
echo '  "expo-av": "~13.2.1",'
echo '  "@react-native-async-storage/async-storage": "1.17.11",'
echo '  "lucide-react-native": "^0.263.1",'
echo '  "react-native-gesture-handler": "~2.9.0",'
echo '  "react-native-reanimated": "~2.14.4"'
echo ""
echo "🔧 Add to app.json plugins array:"
echo '  ['
echo '    "expo-av",'
echo '    {'
echo '      "microphonePermission": "Allow OREMUS to access microphone for voice search."'
echo '    }'
echo '  ]'
echo ""
echo "🎯 Add to your navigation (Tab.Navigator):"
echo 'import ODBPlayerScreen from "./src/screens/ODBPlayerScreen";'
echo ''
echo '<Tab.Screen'
echo '  name="ODBPlayer"'
echo '  component={ODBPlayerScreen}'
echo '  options={{'
echo '    tabBarLabel: "Player",'
echo '    tabBarIcon: ({ color }) => <Music size={24} color={color} />'
echo '  }}'
echo '/>'
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Copy all files from the artifact above"
echo "2. Run: cd mobile && npm install"
echo "3. Run: expo start"
echo "4. Test on phone/tablet/desktop"
echo ""
echo "✅ Setup script complete!"
echo "📱 Ready for ODB Player implementation!"
