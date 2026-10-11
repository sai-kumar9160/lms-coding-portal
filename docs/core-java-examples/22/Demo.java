import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    static class Wallet {
        private int balance;
        void deposit(int amount) {
            if (amount <= 0) throw new IllegalArgumentException("Amount");
            balance += amount;
        }
        int getBalance() { return balance; }
    }

    public static void main(String[] args) throws Exception {
        Wallet wallet = new Wallet();
        wallet.deposit(100);
        System.out.println(wallet.getBalance());
    }
}
