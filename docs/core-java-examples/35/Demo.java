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
    static class InsufficientBalanceException extends Exception {
        InsufficientBalanceException(String message) { super(message); }
    }
    static void withdraw(int balance, int amount) throws InsufficientBalanceException {
        if (amount > balance) throw new InsufficientBalanceException("Insufficient balance");
    }

    public static void main(String[] args) throws Exception {
        try {
            withdraw(500, 700);
        } catch (InsufficientBalanceException ex) {
            System.out.println(ex.getMessage());
        }
    }
}
