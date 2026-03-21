import os

file_path = "d:/WORKSPACE/radioQuiz/RadioQuizExpo/node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
in_launch_block = False

for line in lines:
    if ") = scope.launch {" in line:
        line = line.replace(") = scope.launch {", ") { scope.launch {")
        in_launch_block = True
    elif in_launch_block and line.rstrip() == "    }":
        line = "    } }\n"
        in_launch_block = False
    
    new_lines.append(line)

with open(file_path, "w", encoding="utf-8", newline='\n') as f:
    f.writelines(new_lines)

print("Patched MusicModule.kt successfully.")
