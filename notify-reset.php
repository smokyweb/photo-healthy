<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
  exit;
}

$to = trim($input['email'] ?? '');
$name = trim($input['name'] ?? 'there');
$type = trim($input['type'] ?? 'reset');
$resetUrl = trim($input['reset_url'] ?? '');
$fromEmail = trim($input['from_email'] ?? 'noreply@photoai.betaplanets.com');
$fromName = trim($input['from_name'] ?? 'Photo Healthy');

if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Recipient email required']);
  exit;
}

if (!$resetUrl || !filter_var($resetUrl, FILTER_VALIDATE_URL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Reset URL required']);
  exit;
}

if (!filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
  $fromEmail = 'noreply@photoai.betaplanets.com';
}

$fromName = preg_replace('/[\r\n]+/', ' ', $fromName);
$safeName = htmlspecialchars($name ?: 'there', ENT_QUOTES, 'UTF-8');
$safeResetUrl = htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8');
$isNewUser = $type === 'new_user';
$subject = $isNewUser ? 'Set up your Photo Healthy password' : 'Reset your Photo Healthy password';
$headline = $isNewUser ? 'Welcome to Photo Healthy' : 'Reset your password';
$intro = $isNewUser
  ? 'Your Photo Healthy account is ready. Use the button below to create your password.'
  : 'We received a request to reset your Photo Healthy password. Use the button below to choose a new one.';

$body = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#202333;font-family:Arial,sans-serif">'
  . '<div style="max-width:640px;margin:0 auto;padding:32px 20px">'
  . '<div style="background:linear-gradient(135deg,#F55B09,#FFD000);border-radius:16px;padding:30px;text-align:center;margin-bottom:20px">'
  . '<h1 style="color:#fff;margin:0;font-size:28px">' . $headline . '</h1>'
  . '</div>'
  . '<div style="background:#3B3E4F;border-radius:16px;padding:24px">'
  . '<p style="color:#EAECEF;margin:0 0 16px;font-size:16px">Hi ' . $safeName . ',</p>'
  . '<p style="color:#C0C7D1;margin:0 0 20px;line-height:1.5">' . $intro . '</p>'
  . '<div style="text-align:center;margin:28px 0">'
  . '<a href="' . $safeResetUrl . '" style="display:inline-block;background:linear-gradient(135deg,#F55B09,#FFD000);color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 24px">Create new password</a>'
  . '</div>'
  . '<p style="color:#A8B3C2;margin:20px 0 0;font-size:13px;line-height:1.5">This link expires in 72 hours. If you did not request this, you can ignore this email.</p>'
  . '<p style="color:#A8B3C2;margin:14px 0 0;font-size:13px;line-height:1.5">If the button does not work, copy and paste this link into your browser:<br><span style="color:#54DFB6;word-break:break-all">' . $safeResetUrl . '</span></p>'
  . '</div>'
  . '<p style="color:#6F7D8B;font-size:12px;text-align:center">Photo Healthy</p>'
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
