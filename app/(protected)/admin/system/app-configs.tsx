"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import pkg from "package.json";
import { toast } from "sonner";
import useSWR from "swr";

import { siteConfig } from "@/config/site";
import { fetcher } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/shared/icons";
import VersionNotifier from "@/components/shared/version-notifier";
import { Modal } from "@/components/ui/modal";
import { PenLine, Trash2 } from "lucide-react";

export default function AppConfigs({}: {}) {
  const [isPending, startTransition] = useTransition();
  const [loginMethodCount, setLoginMethodCount] = useState(0);

  const {
    data: configs,
    isLoading,
    mutate,
  } = useSWR<Record<string, any>>("/api/admin/configs", fetcher);
  const [notification, setNotification] = useState("");
  const [catchAllEmails, setCatchAllEmails] = useState("");
  const [emailSuffix, setEmailSuffix] = useState("");
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [tgTemplate, setTgTemplate] = useState("");
  const [tgWhiteList, setTgWhiteList] = useState("");

  // State cho giá plan
  const [planPrices, setPlanPrices] = useState<{ [key: string]: number }>({});
  const [merchantId, setMerchantId] = useState("");
  const [apiKey, setApiKey] = useState("");

  // State cho quản lý Gmail
  const [gmailList, setGmailList] = useState<any[]>([]);
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [editGmail, setEditGmail] = useState<any | null>(null);
  const [editAccessToken, setEditAccessToken] = useState("");
  const [editRefreshToken, setEditRefreshToken] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchGmailList = async () => {
    setLoadingGmail(true);
    const res = await fetch("/api/admin/gmail-tokens");
    const data = await res.json();
    setGmailList(data);
    setLoadingGmail(false);
  };

  useEffect(() => {
    fetchGmailList();
  }, []);

  const handleDeleteGmail = async (email: string) => {
    if (!window.confirm(`Xóa Gmail ${email}?`)) return;
    await fetch("/api/admin/gmail-tokens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    fetchGmailList();
  };

  const handleEditGmail = (gmail: any) => {
    setEditGmail(gmail);
    setEditAccessToken(gmail.accessToken || "");
    setEditRefreshToken(gmail.refreshToken || "");
    setShowEditModal(true);
  };

  const handleSaveEditGmail = async () => {
    if (!editGmail) return;
    await fetch("/api/admin/gmail-tokens", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: editGmail.email,
        accessToken: editAccessToken,
        refreshToken: editRefreshToken,
      }),
    });
    setShowEditModal(false);
    fetchGmailList();
  };

  const t = useTranslations("Setting");

  useEffect(() => {
    if (!isLoading && configs) {
      setNotification(configs?.system_notification);
      setCatchAllEmails(configs?.catch_all_emails);
      setEmailSuffix(configs?.email_registration_suffix_limit_white_list);
      setTgBotToken(configs?.tg_email_bot_token);
      setTgChatId(configs?.tg_email_chat_id);
      setTgTemplate(configs?.tg_email_template);
      setTgWhiteList(configs?.tg_email_target_white_list);
    }
    // 计算登录方式数量
    if (!isLoading) {
      let count = 0;
      if (configs?.enable_google_oauth) count++;
      if (configs?.enable_github_oauth) count++;
      if (configs?.enable_liunxdo_oauth) count++;
      if (configs?.enable_resend_email_login) count++;
      if (configs?.enable_email_password_login) count++;
      setLoginMethodCount(count);
    }

    // Fetch giá plan từ API
    fetch("/api/plan?all=1").then(res => res.json()).then(data => {
      if (data && data.list) {
        const prices: { [key: string]: number } = {};
        data.list.forEach((p: any) => {
          prices[p.name] = p.price || 0;
        });
        setPlanPrices(prices);
      }
    });
    // Fetch merchantId, apiKey từ API hoặc system config nếu có
    fetch("/api/admin/configs").then(res => res.json()).then(data => {
      if (data && data.FPAY_MERCHANT_ID) setMerchantId(data.FPAY_MERCHANT_ID);
      if (data && data.FPAY_API_KEY) setApiKey(data.FPAY_API_KEY);
    });
  }, [configs, isLoading]);

  const handleChange = (value: any, key: string, type: string) => {
    startTransition(async () => {
      const res = await fetch("/api/admin/configs", {
        method: "POST",
        body: JSON.stringify({ key, value, type }),
      });
      if (res.ok) {
        toast.success("Saved");
        mutate();
      } else {
        toast.error("Failed to save", {
          description: await res.text(),
        });
      }
    });
  };

  const handlePriceChange = (plan: string, value: string) => {
    setPlanPrices(prev => ({ ...prev, [plan]: Number(value) }));
  };

  const handleSave = async () => {
    // Lưu giá plan
    await fetch("/api/admin/plan-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planPrices),
    });
    // Lưu merchantId, apiKey
    await fetch("/api/admin/configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ FPAY_MERCHANT_ID: merchantId, FPAY_API_KEY: apiKey }),
    });
    alert("Đã lưu cấu hình!");
  };

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  return (
    <Card>
      <Collapsible className="group">
        <CollapsibleTrigger className="flex w-full items-center justify-between bg-neutral-50 px-4 py-5 dark:bg-neutral-900">
          <div className="text-lg font-bold">{t("App Configs")}</div>
          <Icons.chevronDown className="ml-auto size-4" />
          <Icons.settings className="ml-3 size-4 transition-all group-hover:scale-110" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 bg-neutral-100 p-4 dark:bg-neutral-800">
          <div className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1 leading-none">
                <p className="font-medium">{t("User Registration")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("Allow users to sign up")}
                </p>
              </div>
              {configs && (
                <Switch
                  defaultChecked={configs.enable_user_registration}
                  onCheckedChange={(v) =>
                    handleChange(v, "enable_user_registration", "BOOLEAN")
                  }
                />
              )}
            </div>

            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <div className="space-y-1 text-start leading-none">
                  <p className="font-medium">{t("Login Methods")}</p>

                  <p className="text-xs text-muted-foreground">
                    {t("Select the login methods that users can use to log in")}
                  </p>
                </div>

                <Icons.chevronDown className="ml-auto mr-2 size-4" />
                <Badge>{loginMethodCount}</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 rounded-md bg-neutral-100 p-3 dark:bg-neutral-800">
                {configs && (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm">
                        <Icons.github className="size-4" /> GitHub OAuth
                      </p>
                      <Switch
                        defaultChecked={configs.enable_github_oauth}
                        onCheckedChange={(v) =>
                          handleChange(v, "enable_github_oauth", "BOOLEAN")
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm">
                        <Icons.google className="size-4" />
                        Google OAuth
                      </p>
                      <Switch
                        defaultChecked={configs.enable_google_oauth}
                        onCheckedChange={(v) =>
                          handleChange(v, "enable_google_oauth", "BOOLEAN")
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm">
                        <img
                          src="/_static/images/linuxdo.webp"
                          alt="linuxdo"
                          className="size-4"
                        />
                        LinuxDo OAuth
                      </p>
                      <Switch
                        defaultChecked={configs.enable_liunxdo_oauth}
                        onCheckedChange={(v) =>
                          handleChange(v, "enable_liunxdo_oauth", "BOOLEAN")
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm">
                        <Icons.resend className="size-4" />
                        {t("Resend Email")}
                      </p>
                      <Switch
                        defaultChecked={configs.enable_resend_email_login}
                        onCheckedChange={(v) =>
                          handleChange(
                            v,
                            "enable_resend_email_login",
                            "BOOLEAN",
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm">
                        <Icons.pwdKey className="size-4" />
                        {t("Email Password")}
                      </p>
                      <Switch
                        defaultChecked={configs.enable_email_password_login}
                        onCheckedChange={(v) =>
                          handleChange(
                            v,
                            "enable_email_password_login",
                            "BOOLEAN",
                          )
                        }
                      />
                    </div>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between space-x-2">
                <div className="space-y-1 leading-none">
                  <p className="flex items-center gap-2 font-medium">
                    {t("Email Suffix Limit")}
                  </p>
                  <p className="text-start text-xs text-muted-foreground">
                    {t(
                      "Enable eamil suffix limit, only works for resend email login and email password login methods",
                    )}
                  </p>
                </div>
                {configs && (
                  <div
                    className="ml-auto flex items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {configs.enable_email_registration_suffix_limit &&
                      !configs.email_registration_suffix_limit_white_list && (
                        <Badge variant="yellow">
                          <Icons.warning className="mr-1 size-3" />{" "}
                          {t("Need to configure")}
                        </Badge>
                      )}
                    <Switch
                      defaultChecked={
                        configs.enable_email_registration_suffix_limit
                      }
                      onCheckedChange={(v) =>
                        handleChange(
                          v,
                          "enable_email_registration_suffix_limit",
                          "BOOLEAN",
                        )
                      }
                    />
                    <Icons.chevronDown className="size-4" />
                  </div>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4 rounded-md border p-4 shadow-md">
                <div className="flex flex-col items-start justify-start gap-3">
                  <div className="space-y-1 leading-none">
                    <p className="font-medium">
                      {t("Email Suffix White List")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Set email suffix white list, split by comma, such as: gmail-com,yahoo-com,hotmail-com",
                      )}
                    </p>
                  </div>
                  {configs && (
                    <div className="flex w-full items-start gap-2">
                      <Textarea
                        className="h-16 max-h-32 min-h-9 resize-y bg-white dark:bg-neutral-700"
                        placeholder="gmail.com,yahoo.com,hotmail.com"
                        rows={5}
                        value={emailSuffix}
                        disabled={
                          !configs.enable_email_registration_suffix_limit
                        }
                        onChange={(e) => setEmailSuffix(e.target.value)}
                      />
                      <Button
                        className="h-9 text-nowrap"
                        disabled={
                          isPending ||
                          emailSuffix ===
                            configs.email_registration_suffix_limit_white_list
                        }
                        onClick={() =>
                          handleChange(
                            emailSuffix,
                            "email_registration_suffix_limit_white_list",
                            "STRING",
                          )
                        }
                      >
                        {t("Save")}
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex flex-col items-start justify-start gap-3">
              <div className="space-y-1 leading-none">
                <p className="font-medium">{t("Notification")}</p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Set system notification, this will be displayed in the header",
                  )}
                </p>
              </div>
              {configs && (
                <div className="flex w-full items-start gap-2">
                  <Textarea
                    className="h-16 max-h-32 min-h-9 resize-y bg-white"
                    placeholder="Support HTML format, such as <div>info</div>"
                    rows={5}
                    // defaultValue={configs.system_notification}
                    value={notification}
                    onChange={(e) => setNotification(e.target.value)}
                  />
                  <Button
                    className="h-9 text-nowrap"
                    disabled={
                      isPending || notification === configs.system_notification
                    }
                    onClick={() =>
                      handleChange(
                        notification,
                        "system_notification",
                        "STRING",
                      )
                    }
                  >
                    {t("Save")}
                  </Button>
                </div>
              )}
            </div>

            <div
              className="flex items-center gap-1 text-xs text-muted-foreground/90"
              style={{ fontFamily: "Bahamas Bold" }}
            >
              Powered by
              <Link
                href={siteConfig.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline-offset-2 hover:underline"
              >
                {siteConfig.name}
              </Link>
              <Link
                href={`${siteConfig.links.github}/releases/latest`}
                target="_blank"
                rel="noreferrer"
                className="font-thin underline-offset-2 hover:underline"
              >
                v{pkg.version}
              </Link>
              <VersionNotifier />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="group border-y">
        <CollapsibleTrigger className="flex w-full items-center justify-between bg-neutral-50 px-4 py-5 dark:bg-neutral-900">
          <div className="text-lg font-bold">{t("Email Configs")}</div>
          <Icons.chevronDown className="ml-auto size-4" />
          <Icons.mail className="ml-3 size-4 transition-all group-hover:scale-110" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 bg-neutral-100 p-4 dark:bg-neutral-800">
          <div className="space-y-6">
            {/* Catch-All */}
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between space-x-2">
                <div className="space-y-1 leading-none">
                  <p className="flex items-center gap-2 font-medium">
                    Catch-All
                  </p>
                  <p className="text-start text-xs text-muted-foreground">
                    {t(
                      "Enable email catch-all, all user's email address which created on this platform will be redirected to the catch-all email address",
                    )}
                  </p>
                </div>
                {configs && (
                  <div
                    className="ml-auto flex items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {configs.enable_email_catch_all &&
                      !configs.catch_all_emails && (
                        <Badge variant="yellow">
                          <Icons.warning className="mr-1 size-3" />{" "}
                          {t("Need to configure")}
                        </Badge>
                      )}
                    <Switch
                      defaultChecked={configs.enable_email_catch_all}
                      onCheckedChange={(v) =>
                        handleChange(v, "enable_email_catch_all", "BOOLEAN")
                      }
                    />

                    <Icons.chevronDown className="size-4" />
                  </div>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4 rounded-md border p-4 shadow-md">
                <div className="flex flex-col items-start justify-start gap-3">
                  <div className="space-y-1 leading-none">
                    <p className="font-medium">
                      {t("Catch-All Email Address")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Set catch-all email address, split by comma if more than one, such as: 1@a-com,2@b-com, Only works when email catch all is enabled",
                      )}
                    </p>
                  </div>
                  {configs && (
                    <div className="flex w-full items-start gap-2">
                      <Textarea
                        className="h-16 max-h-32 min-h-9 resize-y bg-white dark:bg-neutral-700"
                        placeholder="example1@Mail1s.net,example2@Mail1s.net"
                        rows={5}
                        // defaultValue={configs.catch_all_emails}
                        value={catchAllEmails}
                        disabled={!configs.enable_email_catch_all}
                        onChange={(e) => setCatchAllEmails(e.target.value)}
                      />
                      <Button
                        className="h-9 text-nowrap"
                        disabled={
                          isPending ||
                          catchAllEmails === configs.catch_all_emails
                        }
                        onClick={() =>
                          handleChange(
                            catchAllEmails,
                            "catch_all_emails",
                            "STRING",
                          )
                        }
                      >
                        {t("Save")}
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Telegram */}
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between space-x-2">
                <div className="space-y-1 leading-none">
                  <p className="flex items-center gap-2 font-medium">
                    {t("Telegram Pusher")}
                  </p>
                  <p className="text-start text-xs text-muted-foreground">
                    {t("Push message to Telegram groups")}.{" "}
                    <Link
                      href="/docs/developer/telegram-bot"
                      className="text-blue-500"
                      target="_blank"
                    >
                      {t("How to configure Telegram bot")} ?
                    </Link>
                  </p>
                </div>
                {configs && (
                  <div
                    className="ml-auto flex items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {configs.enable_tg_email_push &&
                      (!configs.tg_email_bot_token ||
                        !configs.tg_email_chat_id) && (
                        <Badge variant="yellow">
                          <Icons.warning className="mr-1 size-3" />{" "}
                          {t("Need to configure")}
                        </Badge>
                      )}
                    <Switch
                      defaultChecked={configs.enable_tg_email_push}
                      onCheckedChange={(v) =>
                        handleChange(v, "enable_tg_email_push", "BOOLEAN")
                      }
                    />
                    <Icons.chevronDown className="size-4" />
                  </div>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4 rounded-md border p-4 shadow-md">
                <div className="flex flex-col items-start justify-start gap-3">
                  <div className="space-y-1 leading-none">
                    <p className="font-medium">{t("Telegram Bot Token")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Set Telegram bot token, Only works when Telegram pusher is enabled",
                      )}
                    </p>
                  </div>
                  {configs && (
                    <div className="flex w-full items-start gap-2">
                      <Input
                        className="bg-white dark:bg-neutral-700"
                        placeholder="Enter your Telegram bot token"
                        type="password"
                        value={tgBotToken}
                        disabled={!configs.enable_tg_email_push}
                        onChange={(e) => setTgBotToken(e.target.value)}
                      />
                      <Button
                        className="h-9 text-nowrap"
                        disabled={
                          isPending || tgBotToken === configs.tg_email_bot_token
                        }
                        onClick={() =>
                          handleChange(
                            tgBotToken,
                            "tg_email_bot_token",
                            "STRING",
                          )
                        }
                      >
                        {t("Save")}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start justify-start gap-3">
                  <div className="space-y-1 leading-none">
                    <p className="font-medium">{t("Telegram Group ID")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Set Telegram group ID, split by comma if more than one, such as: -10054275724,-10045343642",
                      )}
                    </p>
                  </div>
                  {configs && (
                    <div className="flex w-full items-start gap-2">
                      <Textarea
                        className="h-16 max-h-32 min-h-9 resize-y bg-white dark:bg-neutral-700"
                        placeholder=""
                        rows={5}
                        value={tgChatId}
                        disabled={!configs.enable_tg_email_push}
                        onChange={(e) => setTgChatId(e.target.value)}
                      />
                      <Button
                        className="h-9 text-nowrap"
                        disabled={
                          isPending || tgChatId === configs.tg_email_chat_id
                        }
                        onClick={() =>
                          handleChange(tgChatId, "tg_email_chat_id", "STRING")
                        }
                      >
                        {t("Save")}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start justify-start gap-3">
                  <div className="space-y-1 leading-none">
                    <p className="font-medium">
                      {t("Telegram Message Template")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("Set Telegram email message template")}
                    </p>
                  </div>
                  {configs && (
                    <div className="flex w-full items-start gap-2">
                      <Textarea
                        className="h-16 max-h-32 min-h-9 resize-y bg-white dark:bg-neutral-700"
                        placeholder="Support Markdown, such as: 📧 *New Email* *From:* {{from}} *Subject:* {{subject}} ```content {{text}}```"
                        rows={5}
                        value={tgTemplate}
                        disabled={!configs.enable_tg_email_push}
                        onChange={(e) => setTgTemplate(e.target.value)}
                      />
                      <Button
                        className="h-9 text-nowrap"
                        disabled={
                          isPending || tgTemplate === configs.tg_email_template
                        }
                        onClick={() =>
                          handleChange(
                            tgTemplate,
                            "tg_email_template",
                            "STRING",
                          )
                        }
                      >
                        {t("Save")}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start justify-start gap-3">
                  <div className="space-y-1 leading-none">
                    <p className="font-medium">
                      {t("Telegram Push Email White List")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Set Telegram push email white list, split by comma, if not set, will push all emails",
                      )}
                    </p>
                  </div>
                  {configs && (
                    <div className="flex w-full items-start gap-2">
                      <Textarea
                        className="h-16 max-h-32 min-h-9 resize-y bg-white dark:bg-neutral-700"
                        placeholder=""
                        rows={5}
                        value={tgWhiteList}
                        disabled={!configs.enable_tg_email_push}
                        onChange={(e) => setTgWhiteList(e.target.value)}
                      />
                      <Button
                        className="h-9 text-nowrap"
                        disabled={
                          isPending ||
                          tgWhiteList === configs.tg_email_target_white_list
                        }
                        onClick={() =>
                          handleChange(
                            tgWhiteList,
                            "tg_email_target_white_list",
                            "STRING",
                          )
                        }
                      >
                        {t("Save")}
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="group">
        <CollapsibleTrigger className="flex w-full items-center justify-between bg-neutral-50 px-4 py-5 dark:bg-neutral-900">
          <div className="text-lg font-bold">{t("Subdomain Configs")}</div>
          <Icons.chevronDown className="ml-auto size-4" />
          <Icons.globeLock className="ml-3 size-4 transition-all group-hover:scale-110" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 bg-neutral-100 p-4 dark:bg-neutral-800">
          <div className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1 leading-none">
                <p className="font-medium">{t("Subdomain Apply Mode")}</p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Enable subdomain apply mode, each submission requires administrator review",
                  )}
                </p>
              </div>
              {configs && (
                <Switch
                  defaultChecked={configs.enable_subdomain_apply}
                  onCheckedChange={(v) =>
                    handleChange(v, "enable_subdomain_apply", "BOOLEAN")
                  }
                />
              )}
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1 leading-none">
                <p className="font-medium">
                  {t("Application Status Email Notifications")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Send email notifications for subdomain application status updates; Notifies administrators when users submit applications and notifies users of approval results; Only available when subdomain application mode is enabled",
                  )}
                </p>
              </div>
              {configs && (
                <Switch
                  defaultChecked={configs.enable_subdomain_status_email_pusher}
                  onCheckedChange={(v) =>
                    handleChange(
                      v,
                      "enable_subdomain_status_email_pusher",
                      "BOOLEAN",
                    )
                  }
                />
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cấu hình thanh toán & Giá gói</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">MERCHANT_ID (FPAY)</label>
              <input type="text" className="w-full border rounded p-2" value={merchantId} onChange={e => setMerchantId(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold mb-1">API_KEY (FPAY)</label>
              <input type="text" className="w-full border rounded p-2" value={apiKey} onChange={e => setApiKey(e.target.value)} />
            </div>
          </div>
          <div className="mt-6">
            <label className="block font-semibold mb-2">Giá từng gói (USDT)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(planPrices).map(plan => (
                <div key={plan} className="flex flex-col items-start">
                  <span className="capitalize font-medium mb-1">{plan}</span>
                  <input
                    type="number"
                    className="border rounded p-2 w-32"
                    value={planPrices[plan]}
                    onChange={e => handlePriceChange(plan, e.target.value)}
                    min={0}
                  />
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Lưu cấu hình</button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quản lý Gmail đã thêm</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGmail ? (
            <div>Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Trạng thái</th>
                    <th className="p-2 border">Thời gian</th>
                    <th className="p-2 border">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {gmailList.length === 0 ? (
                    <tr><td colSpan={4} className="text-center p-2">Chưa có Gmail nào</td></tr>
                  ) : gmailList.map(gmail => (
                    <tr key={gmail.id}>
                      <td className="p-2 border">{gmail.email}</td>
                      <td className="p-2 border">{gmail.status}</td>
                      <td className="p-2 border">{gmail.time ? new Date(gmail.time).toLocaleString() : ""}</td>
                      <td className="p-2 border flex gap-2">
                        <Button
                          className="h-7 px-1 text-xs hover:bg-slate-100 dark:hover:text-primary-foreground sm:px-1.5"
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditGmail(gmail)}
                        >
                          <span className="hidden sm:block">Edit</span>
                          <PenLine className="mx-0.5 size-4 sm:ml-1 sm:size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-100 hover:text-red-600"
                          onClick={() => handleDeleteGmail(gmail.email)}
                          title="Xóa Gmail"
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={fetchGmailList} className="mt-4 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Làm mới</button>
        </CardContent>
      </Card>
      <Modal showModal={showEditModal} setShowModal={setShowEditModal} className="max-w-lg">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Chỉnh sửa Gmail</h2>
          <div className="mb-3">
            <label className="block font-semibold mb-1">Email</label>
            <input type="text" className="w-full border rounded p-2" value={editGmail?.email || ""} readOnly />
          </div>
          <div className="mb-3">
            <label className="block font-semibold mb-1">Access Token</label>
            <textarea className="w-full border rounded p-2" rows={3} value={editAccessToken} onChange={e => setEditAccessToken(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="block font-semibold mb-1">Refresh Token</label>
            <textarea className="w-full border rounded p-2" rows={2} value={editRefreshToken} onChange={e => setEditRefreshToken(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowEditModal(false)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Hủy</button>
            <button onClick={handleSaveEditGmail} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Lưu</button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
