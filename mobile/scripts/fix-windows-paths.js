/**
 * Windows MAX_PATH (260 char) Workaround for React Native Libraries
 *
 * On Windows, CMake/Ninja fails when C++ source files reside in a parent directory (`../Common/cpp`, `../shared/shadowNodes`, etc.)
 * because Ninja calculates object file paths using the full absolute path, exceeding 260 chars:
 * "ninja: error: mkdir(CMakeFiles/...): No such file or directory" or
 * "ninja: error: Stat(CMakeFiles/...): Filename longer than 260 characters"
 *
 * This script creates NTFS directory junctions (no admin rights needed) from
 * subfolders to the common/shared/codegen folders and patches CMakeLists.txt to prefer local
 * paths when present, reducing object file paths by ~80-120 characters.
 */

const fs = require('fs');
const path = require('path');

function createJunctionSafe(target, linkPath) {
  if (fs.existsSync(target) && !fs.existsSync(linkPath)) {
    try {
      fs.symlinkSync(target, linkPath, 'junction');
      console.log(`[fix-windows-paths] Junction: ${linkPath} -> ${target}`);
    } catch (err) {
      console.warn(`[fix-windows-paths] Junction error: ${err.message}`);
    }
  }
}

function fixAllPackages() {
  const nodeModules = path.resolve(__dirname, '..', 'node_modules');

  // 1. react-native-worklets
  const workletsDir = path.join(nodeModules, 'react-native-worklets');
  if (fs.existsSync(workletsDir)) {
    createJunctionSafe(path.join(workletsDir, 'Common'), path.join(workletsDir, 'android', 'Common'));
    const cmake = path.join(workletsDir, 'android', 'CMakeLists.txt');
    if (fs.existsSync(cmake)) {
      let content = fs.readFileSync(cmake, 'utf8');
      if (!content.includes('if(EXISTS "${CMAKE_SOURCE_DIR}/Common/cpp")')) {
        const target = 'set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../Common/cpp")';
        const replacement = [
          'if(EXISTS "${CMAKE_SOURCE_DIR}/Common/cpp")',
          '  set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/Common/cpp")',
          'else()',
          '  set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../Common/cpp")',
          'endif()'
        ].join('\n');
        if (content.includes(target)) {
          fs.writeFileSync(cmake, content.replace(target, replacement), 'utf8');
          console.log('[fix-windows-paths] Patched react-native-worklets CMakeLists.txt');
        }
      }
    }
  }

  // 2. react-native-reanimated
  const reanimatedDir = path.join(nodeModules, 'react-native-reanimated');
  if (fs.existsSync(reanimatedDir)) {
    createJunctionSafe(path.join(reanimatedDir, 'Common'), path.join(reanimatedDir, 'android', 'Common'));
    const cmake = path.join(reanimatedDir, 'android', 'CMakeLists.txt');
    if (fs.existsSync(cmake)) {
      let content = fs.readFileSync(cmake, 'utf8');
      if (!content.includes('if(EXISTS "${CMAKE_SOURCE_DIR}/Common/cpp")')) {
        const target = 'set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../Common/cpp")\nset(NATIVEVIEW_DIR "${CMAKE_SOURCE_DIR}/../Common/NativeView")';
        const replacement = [
          'if(EXISTS "${CMAKE_SOURCE_DIR}/Common/cpp")',
          '  set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/Common/cpp")',
          '  set(NATIVEVIEW_DIR "${CMAKE_SOURCE_DIR}/Common/NativeView")',
          'else()',
          '  set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../Common/cpp")',
          '  set(NATIVEVIEW_DIR "${CMAKE_SOURCE_DIR}/../Common/NativeView")',
          'endif()'
        ].join('\n');
        if (content.includes(target)) {
          fs.writeFileSync(cmake, content.replace(target, replacement), 'utf8');
          console.log('[fix-windows-paths] Patched react-native-reanimated CMakeLists.txt');
        }
      }
    }

    // Reanimated NativeView codegen_jni
    const nvDir = path.join(reanimatedDir, 'Common', 'NativeView');
    const codegenJniTarget = path.join(reanimatedDir, 'android', 'build', 'generated', 'source', 'codegen', 'jni');
    createJunctionSafe(codegenJniTarget, path.join(nvDir, 'codegen_jni'));
    const nvCmake = path.join(nvDir, 'CMakeLists.txt');
    if (fs.existsSync(nvCmake)) {
      let content = fs.readFileSync(nvCmake, 'utf8');
      const target = 'set(ANDROID_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../android)\nset(CODEGEN_JNI_DIR ${ANDROID_DIR}/build/generated/source/codegen/jni)';
      const replacement = [
        'set(ANDROID_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../android)',
        'if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/codegen_jni")',
        '  set(CODEGEN_JNI_DIR ${CMAKE_CURRENT_SOURCE_DIR}/codegen_jni)',
        'else()',
        '  set(CODEGEN_JNI_DIR ${ANDROID_DIR}/build/generated/source/codegen/jni)',
        'endif()'
      ].join('\n');
      if (content.includes(target)) {
        fs.writeFileSync(nvCmake, content.replace(target, replacement), 'utf8');
        console.log('[fix-windows-paths] Patched react-native-reanimated NativeView CMakeLists.txt');
      }
    }
  }

  // 3. react-native-gesture-handler
  const rnghDir = path.join(nodeModules, 'react-native-gesture-handler');
  if (fs.existsSync(rnghDir)) {
    createJunctionSafe(path.join(rnghDir, 'shared'), path.join(rnghDir, 'android', 'shared'));
    const cmake = path.join(rnghDir, 'android', 'CMakeLists.txt');
    if (fs.existsSync(cmake)) {
      let content = fs.readFileSync(cmake, 'utf8');
      if (content.includes('../shared/shadowNodes')) {
        content = content.replace(/\.\.\/shared\/shadowNodes/g, 'shared/shadowNodes');
        fs.writeFileSync(cmake, content, 'utf8');
        console.log('[fix-windows-paths] Patched react-native-gesture-handler CMakeLists.txt');
      }
    }
  }

  // 4. react-native-screens
  const screensDir = path.join(nodeModules, 'react-native-screens');
  if (fs.existsSync(screensDir)) {
    const screensJni = path.join(screensDir, 'android', 'src', 'main', 'jni');
    createJunctionSafe(path.join(screensDir, 'common'), path.join(screensJni, 'common'));
    createJunctionSafe(
      path.join(screensDir, 'android', 'build', 'generated', 'source', 'codegen', 'jni'),
      path.join(screensJni, 'codegen_jni')
    );
    const cmake = path.join(screensJni, 'CMakeLists.txt');
    if (fs.existsSync(cmake)) {
      let content = fs.readFileSync(cmake, 'utf8');
      let changed = false;

      const commonTarget = 'set(LIB_COMMON_DIR ${LIB_ANDROID_DIR}/../common/cpp)';
      const commonReplacement = [
        'if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/common/cpp")',
        '  set(LIB_COMMON_DIR ${CMAKE_CURRENT_SOURCE_DIR}/common/cpp)',
        'else()',
        '  set(LIB_COMMON_DIR ${LIB_ANDROID_DIR}/../common/cpp)',
        'endif()'
      ].join('\n');
      if (content.includes(commonTarget)) {
        content = content.replace(commonTarget, commonReplacement);
        changed = true;
      }

      const jniTarget = 'set(LIB_ANDROID_GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)';
      const jniReplacement = [
        'if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/codegen_jni")',
        '  set(LIB_ANDROID_GENERATED_JNI_DIR ${CMAKE_CURRENT_SOURCE_DIR}/codegen_jni)',
        'else()',
        '  set(LIB_ANDROID_GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)',
        'endif()'
      ].join('\n');
      if (content.includes(jniTarget)) {
        content = content.replace(jniTarget, jniReplacement);
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(cmake, content, 'utf8');
        console.log('[fix-windows-paths] Patched react-native-screens CMakeLists.txt');
      }
    }
  }

  // 5. react-native-safe-area-context
  const safeAreaDir = path.join(nodeModules, 'react-native-safe-area-context');
  if (fs.existsSync(safeAreaDir)) {
    const safeAreaJni = path.join(safeAreaDir, 'android', 'src', 'main', 'jni');
    createJunctionSafe(path.join(safeAreaDir, 'common'), path.join(safeAreaJni, 'common'));
    createJunctionSafe(
      path.join(safeAreaDir, 'android', 'build', 'generated', 'source', 'codegen', 'jni'),
      path.join(safeAreaJni, 'codegen_jni')
    );
    const cmake = path.join(safeAreaJni, 'CMakeLists.txt');
    if (fs.existsSync(cmake)) {
      let content = fs.readFileSync(cmake, 'utf8');
      let changed = false;

      const commonTarget = 'set(LIB_COMMON_DIR ${LIB_ANDROID_DIR}/../common/cpp)';
      const commonReplacement = [
        'if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/common/cpp")',
        '  set(LIB_COMMON_DIR ${CMAKE_CURRENT_SOURCE_DIR}/common/cpp)',
        'else()',
        '  set(LIB_COMMON_DIR ${LIB_ANDROID_DIR}/../common/cpp)',
        'endif()'
      ].join('\n');
      if (content.includes(commonTarget)) {
        content = content.replace(commonTarget, commonReplacement);
        changed = true;
      }

      const jniTarget = 'set(LIB_ANDROID_GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)';
      const jniReplacement = [
        'if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/codegen_jni")',
        '  set(LIB_ANDROID_GENERATED_JNI_DIR ${CMAKE_CURRENT_SOURCE_DIR}/codegen_jni)',
        'else()',
        '  set(LIB_ANDROID_GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)',
        'endif()'
      ].join('\n');
      if (content.includes(jniTarget)) {
        content = content.replace(jniTarget, jniReplacement);
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(cmake, content, 'utf8');
        console.log('[fix-windows-paths] Patched react-native-safe-area-context CMakeLists.txt');
      }
    }
  }
}

if (process.platform === 'win32') {
  fixAllPackages();
}
