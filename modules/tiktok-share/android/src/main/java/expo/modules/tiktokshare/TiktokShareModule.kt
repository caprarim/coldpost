package expo.modules.tiktokshare

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TiktokShareModule : Module() {
  private val tiktokPackages = listOf(
    "com.zhiliaoapp.musically",
    "com.ss.android.ugc.trill",
    "com.zhiliaoapp.musically.go",
    "com.ss.android.ugc.tiktok.lite"
  )

  override fun definition() = ModuleDefinition {
    Name("TiktokShare")

    Function("share") { contentUri: String, mimeType: String ->
      val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
      launch(activity, Uri.parse(contentUri), mimeType)
    }
  }

  private fun buildIntent(uri: Uri, mimeType: String, target: String?): Intent {
    return Intent(Intent.ACTION_SEND).apply {
      type = mimeType
      putExtra(Intent.EXTRA_STREAM, uri)
      clipData = ClipData.newRawUri("video", uri)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      if (target != null) setPackage(target)
    }
  }

  private fun launch(activity: Activity, uri: Uri, mimeType: String): String {
    for (target in tiktokPackages) {
      try {
        activity.startActivity(buildIntent(uri, mimeType, target))
        return "tiktok"
      } catch (_: ActivityNotFoundException) {
      }
    }
    val chooser = Intent.createChooser(buildIntent(uri, mimeType, null), null).apply {
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    activity.startActivity(chooser)
    return "chooser"
  }
}
