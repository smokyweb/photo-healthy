<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
  exit;
}

$recipient = $input['recipient'] ?? [];
$to = trim($recipient['email'] ?? '');
$name = trim($recipient['name'] ?? 'there');
$fromEmail = trim($input['from_email'] ?? 'noreply@photoai.betaplanets.com');
$fromName = trim($input['from_name'] ?? 'Photo Healthy');
$appUrl = rtrim($input['app_url'] ?? 'https://photoai.betaplanets.com', '/');
$totalLikes = intval($input['total_likes'] ?? 0);
$totalComments = intval($input['total_comments'] ?? 0);
$photos = is_array($input['photos'] ?? null) ? $input['photos'] : [];
$comments = is_array($input['comments'] ?? null) ? $input['comments'] : [];

if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Recipient email required']);
  exit;
}

$fromName = preg_replace('/[\r\n]+/', ' ', $fromName);
if (!filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
  $fromEmail = 'noreply@photoai.betaplanets.com';
}

if ($totalLikes <= 0 && $totalComments <= 0) {
  echo json_encode(['ok' => true, 'skipped' => true, 'reason' => 'No activity']);
  exit;
}

function e($value) {
  return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

$photoRows = '';
foreach (array_slice($photos, 0, 10) as $photo) {
  $title = e($photo['title'] ?? 'Your photo');
  $challenge = e($photo['challenge_title'] ?? '');
  $likes = intval($photo['likes'] ?? 0);
  $photoComments = intval($photo['comments'] ?? 0);
  $url = e($photo['url'] ?? $appUrl . '/community');
  $meta = [];
  if ($likes > 0) $meta[] = $likes . ' like' . ($likes === 1 ? '' : 's');
  if ($photoComments > 0) $meta[] = $photoComments . ' comment' . ($photoComments === 1 ? '' : 's');
  $metaText = e(implode(' and ', $meta));
  $photoRows .= '<tr><td style="padding:14px 0;border-bottom:1px solid #4C5763">'
    . '<a href="' . $url . '" style="color:#54DFB6;text-decoration:none;font-weight:700">' . $title . '</a>'
    . ($challenge ? '<div style="color:#A8B3C2;font-size:13px;margin-top:4px">' . $challenge . '</div>' : '')
    . '<div style="color:#EAECEF;font-size:14px;margin-top:6px">' . $metaText . '</div>'
    . '</td></tr>';
}

$commentRows = '';
foreach (array_slice($comments, 0, 8) as $comment) {
  $actor = e($comment['actor_name'] ?? 'Someone');
  $photoTitle = e($comment['photo_title'] ?? 'your photo');
  $text = e($comment['text'] ?? '');
  $commentRows .= '<div style="background:#282C3D;border-radius:10px;padding:14px;margin-top:10px">'
    . '<div style="color:#EAECEF;font-weight:700">' . $actor . ' commented on ' . $photoTitle . '</div>'
    . '<div style="color:#C0C7D1;margin-top:6px;line-height:1.45">' . nl2br($text) . '</div>'
    . '</div>';
}

$summaryParts = [];
if ($totalLikes > 0) $summaryParts[] = $totalLikes . ' new like' . ($totalLikes === 1 ? '' : 's');
if ($totalComments > 0) $summaryParts[] = $totalComments . ' new comment' . ($totalComments === 1 ? '' : 's');
$summary = implode(' and ', $summaryParts);

$subject = 'Your daily Photo Healthy activity';
$body = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#202333;font-family:Arial,sans-serif">'
  . '<div style="max-width:640px;margin:0 auto;padding:32px 20px">'
  . '<div style="background:linear-gradient(135deg,#F55B09,#FFD000);border-radius:16px;padding:30px;text-align:center;margin-bottom:20px">'
  . '<h1 style="color:#fff;margin:0;font-size:26px">Your Photo Healthy activity</h1>'
  . '<p style="color:rgba(255,255,255,0.92);margin:10px 0 0;font-size:16px">You received ' . e($summary) . ' in the last day.</p>'
  . '</div>'
  . '<div style="background:#3B3E4F;border-radius:16px;padding:24px;margin-bottom:16px">'
  . '<p style="color:#EAECEF;margin:0 0 16px;font-size:16px">Hi ' . e($name) . ',</p>'
  . '<p style="color:#C0C7D1;margin:0 0 16px;line-height:1.5">Here is what people noticed on your photos since yesterday.</p>'
  . '<table style="width:100%;border-collapse:collapse">' . $photoRows . '</table>'
  . '</div>';

if ($commentRows) {
  $body .= '<div style="background:#3B3E4F;border-radius:16px;padding:24px;margin-bottom:16px">'
    . '<h2 style="color:#fff;margin:0 0 8px;font-size:20px">Recent comments</h2>'
    . $commentRows
    . '</div>';
}

$body .= '<div style="text-align:center;margin:26px 0">'
  . '<a href="' . e($appUrl . '/community') . '" style="display:inline-block;background:linear-gradient(135deg,#F55B09,#FFD000);color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 24px">View community activity</a>'
  . '</div>'
  . '<p style="color:#6F7D8B;font-size:12px;text-align:center">Photo Healthy - ' . e($appUrl) . '</p>'
  . '</div></body></html>';

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/html; charset=UTF-8';
$headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';
$headers[] = 'Reply-To: ' . $fromEmail;

$sent = mail($to, $subject, $body, implode("\r\n", $headers));
if (!$sent) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'mail() failed']);
  exit;
}

echo json_encode(['ok' => true, 'email' => $to]);
?>
